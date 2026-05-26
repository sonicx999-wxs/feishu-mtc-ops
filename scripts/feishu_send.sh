#!/bin/bash
# ============================================================
# 飞书群聊消息发送工具（应用身份）
# 用法: ./feishu_send.sh <群聊名称或ID> <消息内容>
# 示例: ./feishu_send.sh "技术交流群" "Hello World"
# ============================================================

# ==================== 配置区 ====================
# MCP 配置文件路径（SOLO 环境默认路径）
MCP_CONFIG="/data/user/mcp/mcp-servers.json"

# ==================== 参数解析 ====================
CHAT_QUERY="${1:-}"
MESSAGE="${2:-🤖 SOLO 自动化消息 $(date '+%Y-%m-%d %H:%M')}"

if [ -z "$CHAT_QUERY" ]; then
    echo "❌ 用法: ./feishu_send.sh <群聊名称或ID> <消息内容>"
    echo "示例: ./feishu_send.sh '技术交流群' '测试消息'"
    exit 1
fi

echo "========================================"
echo "飞书群聊消息发送工具"
echo "========================================"
echo "查询目标: $CHAT_QUERY"
echo ""

# ==================== 凭证获取 ====================
if [ ! -f "$MCP_CONFIG" ]; then
    echo "❌ MCP 配置文件不存在: $MCP_CONFIG"
    exit 1
fi

echo "📋 正在读取 MCP 配置..."
APP_ID=$(python3 -c "
import json
try:
    config = json.load(open('$MCP_CONFIG'))
    # 优先从 env 字段读取，如果不存在则从 args 读取
    lark_mcp = config['mcpServers']['lark-mcp']
    if 'env' in lark_mcp:
        app_id = lark_mcp['env'].get('APP_ID', '')
    else:
        args = lark_mcp['args']
        app_id = args[args.index('-a') + 1] if '-a' in args else ''
    print(app_id)
except Exception as e:
    print('')
" 2>/dev/null)

APP_SECRET=$(python3 -c "
import json
try:
    config = json.load(open('$MCP_CONFIG'))
    # 优先从 env 字段读取，如果不存在则从 args 读取
    lark_mcp = config['mcpServers']['lark-mcp']
    if 'env' in lark_mcp:
        app_secret = lark_mcp['env'].get('APP_SECRET', '')
    else:
        args = lark_mcp['args']
        app_secret = args[args.index('-s') + 1] if '-s' in args else ''
    print(app_secret)
except Exception as e:
    print('')
" 2>/dev/null)

if [ -z "$APP_ID" ] || [ -z "$APP_SECRET" ]; then
    echo "❌ 无法从 MCP 配置读取凭证"
    exit 1
fi
echo "✅ 凭证读取成功"

# ==================== 判断是ID还是名称 ====================
if [[ "$CHAT_QUERY" == oc_* ]]; then
    CHAT_ID="$CHAT_QUERY"
    echo "✅ 检测到群聊 ID: $CHAT_ID"
else
    # ==================== 搜索群聊 ====================
    echo ""
    echo "🔍 正在搜索群聊: $CHAT_QUERY"
    
    # 使用飞书 API 搜索群聊
    TOKEN_RESP=$(curl -s -X POST 'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal' \
        -H 'Content-Type: application/json' \
        -d "{\"app_id\":\"$APP_ID\",\"app_secret\":\"$APP_SECRET\"}")
    
    TENANT_TOKEN=$(echo "$TOKEN_RESP" | python3 -c "
import sys, json
resp = json.load(sys.stdin)
token = resp.get('tenant_access_token', '')
print(token)
" 2>/dev/null)
    
    if [ -z "$TENANT_TOKEN" ]; then
        echo "❌ 获取访问令牌失败"
        exit 1
    fi
    
    # 获取用户所在的群聊列表
    LIST_RESP=$(curl -s "https://open.feishu.cn/open-apis/im/v1/chats?page_size=50" \
        -H "Authorization: Bearer $TENANT_TOKEN")
    
    # 解析搜索结果，按名称匹配
    CHATS=$(echo "$LIST_RESP" | python3 -c "
import sys, json
try:
    resp = json.load(sys.stdin)
    if resp.get('code') == 0:
        items = resp.get('data', {}).get('items', [])
        query = '$CHAT_QUERY'
        matched = []
        for chat in items:
            chat_name = chat.get('name', '')
            chat_id = chat.get('chat_id', '')
            # 模糊匹配
            if query.lower() in chat_name.lower() or chat_name.lower() in query.lower():
                matched.append(chat)
        
        if matched:
            print('找到以下匹配的群聊：')
            for i, chat in enumerate(matched[:10], 1):
                print(f\"{i}. {chat.get('name', 'N/A')} (ID: {chat.get('chat_id', 'N/A')})\")
        else:
            print('未找到匹配的群聊，您加入的群聊列表：')
            for i, chat in enumerate(items[:10], 1):
                print(f\"{i}. {chat.get('name', 'N/A')} (ID: {chat.get('chat_id', 'N/A')})\")
    else:
        print('搜索失败:', resp.get('msg', 'Unknown error'))
except Exception as e:
    print('解析失败:', str(e))
" 2>/dev/null)
    
    echo "$CHATS"
    echo ""
    echo "⚠️  请从上方列表中选择目标群聊，重新执行脚本时使用群聊 ID"
    echo "示例: ./feishu_send.sh 'oc_xxxxxxxxxxxxxxxx' '$MESSAGE'"
    exit 0
fi

# ==================== 获取 Token ====================
echo ""
echo "🔑 正在获取访问令牌..."

TOKEN_RESP=$(curl -s -X POST 'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal' \
    -H 'Content-Type: application/json' \
    -d "{\"app_id\":\"$APP_ID\",\"app_secret\":\"$APP_SECRET\"}")

TENANT_TOKEN=$(echo "$TOKEN_RESP" | python3 -c "
import sys, json
resp = json.load(sys.stdin)
token = resp.get('tenant_access_token', '')
if not token:
    print('ERROR: ' + resp.get('msg', 'Unknown error'), file=sys.stderr)
print(token)
" 2>/dev/null)

if [ -z "$TENANT_TOKEN" ]; then
    echo "❌ 获取 tenant_access_token 失败"
    exit 1
fi
echo "✅ Token 获取成功"

# ==================== 发送消息 ====================
echo ""
echo "📤 正在发送消息..."

# 构建请求体（正确处理 JSON 嵌套）
REQUEST_BODY=$(python3 -c "
import json
content = {'text': '''$MESSAGE'''}
body = {
    'receive_id': '$CHAT_ID',
    'msg_type': 'text',
    'content': json.dumps(content, ensure_ascii=False)
}
print(json.dumps(body, ensure_ascii=False))
")

RESP=$(curl -s -X POST "https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=chat_id" \
    -H "Authorization: Bearer $TENANT_TOKEN" \
    -H 'Content-Type: application/json' \
    -d "$REQUEST_BODY")

# ==================== 结果处理 ====================
CODE=$(echo "$RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('code',-1))" 2>/dev/null)
MSG_ID=$(echo "$RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('data',{}).get('message_id',''))" 2>/dev/null)

echo ""
if [ "$CODE" = "0" ]; then
    echo "✅ 消息发送成功！"
    echo "----------------------------------------"
    echo "消息 ID: $MSG_ID"
    echo "群聊 ID: $CHAT_ID"
    echo "发送时间: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "----------------------------------------"
else
    echo "❌ 发送失败"
    echo "响应: $RESP"
fi
