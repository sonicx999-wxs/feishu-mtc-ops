#!/usr/bin/env node
/**
 * ============================================================
 * 飞书群聊消息发送脚本 - 支持群聊名称搜索
 * 
 * 功能：通过飞书 Open API 直接发送消息，支持群聊名称搜索
 * 用法：
 *   - node send_feishu_message.js "群聊名称" "消息内容"    # 按名称搜索并发送
 *   - node send_feishu_message.js "oc_xxxxxxxxxx" "消息"  # 直接发送
 * 
 * 凭证来源：自动从 MCP 配置文件读取，无需硬编码
 * ============================================================
 */

const http = require('http');
const https = require('https');
const fs = require('fs');

// ==================== 配置区 ====================

// MCP 配置文件路径（SOLO 环境默认路径）
const MCP_CONFIG_PATH = '/data/user/mcp/mcp-servers.json';

// 代理配置（自动读取环境变量）
const HTTPS_PROXY = process.env.https_proxy || process.env.HTTPS_PROXY || null;

// ==================== 凭证获取 ====================

/**
 * 从 MCP 配置文件中提取 lark-mcp 凭证
 * 优先从 env 字段读取，如果不存在则从 args 读取
 * @returns {{appId: string, appSecret: string}}
 */
function getCredentialsFromMcpConfig() {
  try {
    const configContent = fs.readFileSync(MCP_CONFIG_PATH, 'utf-8');
    const config = JSON.parse(configContent);
    
    // 查找 lark-mcp 配置
    const mcpServers = config.mcpServers || {};
    let larkMcp = mcpServers['lark-mcp'];
    
    // 如果找不到，尝试查找包含 lark 的配置
    if (!larkMcp) {
      for (const [name, server] of Object.entries(mcpServers)) {
        if (name.includes('lark') || name.includes('feishu')) {
          larkMcp = server;
          break;
        }
      }
    }
    
    if (!larkMcp) {
      throw new Error('未找到 lark-mcp 配置');
    }
    
    let appId = null;
    let appSecret = null;
    
    // 优先从 env 字段读取（新版配置格式）
    if (larkMcp.env) {
      appId = larkMcp.env.APP_ID;
      appSecret = larkMcp.env.APP_SECRET;
    }
    
    // 如果 env 中没有，尝试从 args 读取（旧版配置格式）
    if ((!appId || !appSecret) && larkMcp.args) {
      const args = larkMcp.args;
      for (let i = 0; i < args.length; i++) {
        if (args[i] === '-a' && i + 1 < args.length) {
          appId = args[i + 1];
        }
        if (args[i] === '-s' && i + 1 < args.length) {
          appSecret = args[i + 1];
        }
      }
    }
    
    if (!appId || !appSecret) {
      throw new Error('无法从配置中提取 App ID 或 Secret');
    }
    
    return { appId, appSecret };
  } catch (err) {
    console.error('❌ 读取 MCP 配置失败:', err.message);
    process.exit(1);
  }
}

// ==================== HTTP 代理隧道 ====================

/**
 * 创建代理 CONNECT 隧道
 * @param {string} targetHost - 目标主机
 * @param {number} targetPort - 目标端口
 * @returns {Promise<Socket>}
 */
function createTunnelSocket(targetHost, targetPort) {
  return new Promise((resolve, reject) => {
    if (!HTTPS_PROXY) {
      reject(new Error('未配置代理'));
      return;
    }
    const proxyUrl = new URL(HTTPS_PROXY);
    const connectReq = http.request({
      hostname: proxyUrl.hostname,
      port: parseInt(proxyUrl.port) || 80,
      method: 'CONNECT',
      path: `${targetHost}:${targetPort}`
    });
    connectReq.on('connect', (res, socket) => {
      if (res.statusCode === 200) {
        resolve(socket);
      } else {
        reject(new Error(`代理 CONNECT 失败: ${res.statusCode}`));
      }
    });
    connectReq.on('error', reject);
    connectReq.end();
  });
}

// ==================== HTTP 请求工具 ====================

/**
 * 发送 HTTPS 请求（支持代理）
 * @param {string} urlStr - 请求地址
 * @param {object} extraHeaders - 额外请求头
 * @param {object|null} data - POST 请求体，null 表示 GET
 * @returns {Promise<object>}
 */
function httpsRequest(urlStr, extraHeaders = {}, data = null) {
  return new Promise(async (resolve, reject) => {
    const urlObj = new URL(urlStr);
    const isPost = data !== null;
    const postData = isPost ? JSON.stringify(data) : null;

    try {
      let reqOptions = {
        hostname: urlObj.hostname,
        port: 443,
        path: urlObj.pathname + urlObj.search,
        method: isPost ? 'POST' : 'GET',
        headers: {
          ...(isPost ? { 'Content-Type': 'application/json' } : {}),
          ...(isPost ? { 'Content-Length': Buffer.byteLength(postData) } : {}),
          ...extraHeaders
        }
      };

      let request;
      if (HTTPS_PROXY) {
        // 通过代理 CONNECT 隧道发送请求
        const socket = await createTunnelSocket(urlObj.hostname, 443);
        reqOptions.socket = socket;
        reqOptions.agent = false;
        request = https.request(reqOptions);
      } else {
        request = https.request(reqOptions);
      }

      // 正确：监听 response 事件，在 response 上读取数据
      request.on('response', (response) => {
        let responseData = '';
        response.on('data', (chunk) => { responseData += chunk; });
        response.on('end', () => {
          try {
            resolve(JSON.parse(responseData));
          } catch (e) {
            resolve({ raw: responseData });
          }
        });
      });
      request.on('error', reject);

      if (isPost) {
        request.write(postData);
      }
      request.end();
    } catch (err) {
      reject(err);
    }
  });
}

// ==================== 飞书 API 操作 ====================

/**
 * 获取 tenant_access_token
 * @param {string} appId - 飞书应用 ID
 * @param {string} appSecret - 飞书应用 Secret
 * @returns {Promise<string>}
 */
async function getTenantToken(appId, appSecret) {
  const resp = await httpsRequest(
    'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal',
    {},
    { app_id: appId, app_secret: appSecret }
  );
  
  if (resp.code !== 0 || !resp.tenant_access_token) {
    throw new Error(`获取 Token 失败: ${resp.msg || 'Unknown error'}`);
  }
  
  return resp.tenant_access_token;
}

/**
 * 获取群聊列表
 * @param {string} token - tenant_access_token
 * @returns {Promise<Array>}
 */
async function getChatList(token) {
  const resp = await httpsRequest(
    'https://open.feishu.cn/open-apis/im/v1/chats?page_size=50',
    { 'Authorization': `Bearer ${token}` },
    null  // GET 请求
  );

  if (resp.code !== 0) {
    throw new Error(`获取群聊列表失败: ${resp.msg || 'Unknown error'}`);
  }

  return resp.data?.items || [];
}

/**
 * 搜索群聊 - 使用 /im/v1/chats 接口获取列表后本地模糊匹配
 * @param {string} query - 搜索关键词
 * @param {string} token - tenant_access_token
 * @returns {Promise<Array>}
 */
async function searchChats(query, token) {
  const allChats = await getChatList(token);
  const queryLower = query.toLowerCase();
  
  // 模糊匹配：查询字符串包含在群聊名中，或群聊名包含查询字符串
  const matched = allChats.filter(chat => {
    const nameLower = (chat.name || '').toLowerCase();
    return nameLower.includes(queryLower) || queryLower.includes(nameLower);
  });
  
  return matched.length > 0 ? matched : allChats;
}

/**
 * 发送群聊消息
 * @param {string} chatId - 群聊 ID
 * @param {string} messageText - 消息内容
 * @param {string} token - tenant_access_token
 * @returns {Promise<object>}
 */
async function sendMessage(chatId, messageText, token) {
  const resp = await httpsRequest(
    'https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=chat_id',
    { 'Authorization': 'Bearer ' + token },
    {
      receive_id: chatId,
      msg_type: 'text',
      content: JSON.stringify({ text: messageText })
    }
  );
  
  if (resp.code !== 0) {
    throw new Error('发送消息失败: ' + (resp.msg || 'Unknown error'));
  }
  
  return resp.data;
}

// ==================== 主程序 ====================

async function main() {
  // 解析命令行参数
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('========================================');
    console.log('飞书群聊消息发送工具');
    console.log('========================================');
    console.log('');
    console.log('用法:');
    console.log('  node send_feishu_message.js "群聊名称" "消息内容"');
    console.log('  node send_feishu_message.js "oc_xxxxxxxxxx" "消息内容"');
    console.log('');
    console.log('示例:');
    console.log('  node send_feishu_message.js "技术交流群" "大家好！"');
    console.log('  node send_feishu_message.js "oc_a1b2c3d4" "测试消息"');
    console.log('');
    console.log('说明:');
    console.log('  - 提供群聊名称时会先搜索，列出结果后使用 ID 发送');
    console.log('  - 提供群聊 ID (oc_开头) 时直接发送');
    process.exit(1);
  }
  
  const chatQuery = args[0];
  const messageText = args[1];
  
  console.log('========================================');
  console.log('飞书群聊消息发送工具');
  console.log('========================================');
  console.log(`查询目标: ${chatQuery}`);
  console.log(`消息内容: ${messageText.substring(0, 50)}${messageText.length > 50 ? '...' : ''}`);
  console.log('');
  
  // 获取凭证
  console.log('📋 正在读取 MCP 配置...');
  const { appId, appSecret } = getCredentialsFromMcpConfig();
  console.log(`✅ App ID: ${appId.substring(0, 10)}...`);
  console.log('');
  
  // 获取 Token
  console.log('🔑 正在获取访问令牌...');
  const token = await getTenantToken(appId, appSecret);
  console.log('✅ Token 获取成功');
  console.log('');
  
  let chatId = chatQuery;
  
  // 判断是 ID 还是名称
  if (!chatQuery.startsWith('oc_')) {
    // 搜索群聊
    console.log(`🔍 正在搜索群聊: ${chatQuery}`);
    const chats = await searchChats(chatQuery, token);
    
    if (chats.length === 0) {
      console.log('❌ 未找到匹配的群聊');
      process.exit(1);
    }
    
    console.log('');
    console.log('找到以下群聊:');
    console.log('----------------------------------------');
    chats.slice(0, 5).forEach((chat, index) => {
      console.log(`${index + 1}. ${chat.name}`);
      console.log(`   ID: ${chat.chat_id}`);
    });
    console.log('----------------------------------------');
    console.log('');
    console.log('请使用群聊 ID 重新执行:');
    console.log(`  node send_feishu_message.js "${chats[0].chat_id}" "${messageText}"`);
    process.exit(0);
  }
  
  // 发送消息
  console.log(`📤 正在发送消息到群聊...`);
  const result = await sendMessage(chatId, messageText, token);
  
  console.log('');
  console.log('✅ 消息发送成功！');
  console.log('----------------------------------------');
  console.log(`消息 ID: ${result.message_id}`);
  console.log(`群聊 ID: ${result.chat_id}`);
  console.log(`发送时间: ${new Date().toLocaleString('zh-CN')}`);
  console.log('----------------------------------------');
}

main().catch(err => {
  console.error('❌ 执行失败:', err.message);
  process.exit(1);
});
