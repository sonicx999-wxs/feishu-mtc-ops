# 环境检测方法参考

本文档提供飞书 MTC 模式下环境检测的详细方法。

## 一、CLI 环境检测

### 1.1 检测方法

```bash
lark-cli docs +search --query "health-check" --page-size 1
```

### 1.2 结果判断

| 返回结果 | CLI 状态 | 说明 | 后续处理 |
|---------|---------|------|---------|
| `ok: true, identity: "user"` | ✅ 正常 | CLI 可用，User 身份 | 可执行 User 身份操作 |
| `ok: true, identity: "bot"` | ⚠️ 需验证 | CLI 可用，但需要身份验证 | 引导用户完成验证 |
| `ok: false, error.type: "config"` | ❌ 未授权 | CLI 未完成授权配置 | 引导用户授权 |
| `command not found` | ❌ 未安装 | lark-cli 未安装 | 提示安装或使用其他方案 |
| `ETIMEDOUT` | ⚠️ 网络问题 | 网络超时 | 检查代理配置 |
| `external_provider` | ✅ 正常 | MTC 模式正常响应 | 可执行 User 身份操作 |

### 1.3 扩展检测

```bash
# 检测 CLI 版本
lark-cli --version

# 检测授权状态
lark-cli auth status
```

---

## 二、MCP 环境检测

### 2.1 检测方法

有以下几种检测方法：

**方法A：进程检查（最直接）**
```bash
ps aux | grep -E "(lark-mcp|@larksuiteoapi)" | grep -v grep
```

**判断标准**：如果有以下任一进程在运行，说明 MCP 服务已启动：
- `node ... lark-mcp ...`
- `npm exec @larksuiteoapi/lark-mcp ...`

**方法B：工具调用测试（最可靠）**
```python
mcp_lark-mcp_im_v1_chat_list(
    params={"page_size": 1},
    useUAT=False
)
```

**判断标准**：
- 成功返回数据 → MCP 服务正常
- `Tool's name ... is not available` → MCP 工具缺失
- `Connection closed` → MCP 服务未启动

**方法C：日志检查（调试用）**
```bash
tail -20 /var/log/tool/agent-tool-host.stdout.log | grep -i "mcp.*tool"
```

**关键日志模式**：
```
INFO mcp_client::server_group: MCP tool call completed successfully
```

**方法D：配置文件检查**
```bash
cat /data/user/mcp/mcp-servers.json
```

检查配置文件是否存在且格式正确。

### 2.2 MCP 服务状态分类

| 检测结果 | MCP 状态 | 说明 | 后续处理 |
|---------|---------|------|---------|
| 进程运行 + 工具调用成功 | ✅ 正常 | MCP 完全可用 | 可执行 App 身份操作 |
| 进程运行 + 工具不可用 | ⚠️ 工具缺失 | MCP 运行但工具未注册 | 检查配置的工具列表 |
| 进程不存在 | ❌ 未启动 | MCP 服务未运行 | 提示用户启动 MCP |
| 调用超时 | ⚠️ 网络问题 | MCP 响应超时 | 检查网络和代理 |
| 工具列表为空 | ⚠️ 配置问题 | 未配置任何工具 | 提示配置 MCP 工具 |

### 2.3 MCP 工具列表检测

```bash
# 查看 MCP 配置文件中的工具列表
cat /data/user/mcp/mcp-servers.json | grep -o "\-t [^\"]*"
```

常用 MCP 工具清单：

| 工具类型 | 工具名称 | 功能 |
|---------|---------|------|
| 消息 | `im_v1_message_create` | 发送消息 |
| 消息 | `im_v1_message_list` | 获取消息列表 |
| 群聊 | `im_v1_chat_create` | 创建群聊 |
| 群聊 | `im_v1_chat_list` | 获取群聊列表 |
| 群聊 | `im_v1_chatMembers_get` | 获取群成员 |
| 群聊 | `im_v1_chatMembers_create` | 添加群成员 |
| 群聊 | `im_v1_chatMembers_delete` | 删除群成员 |
| 表格 | `sheets_v1_spreadsheet_create` | 创建表格 |
| 表格 | `sheets_v1_spreadsheet_sheet_value` | 读写表格数据 |
| 多维表格 | `bitable_v1_app_create` | 创建多维表格 |
| 多维表格 | `bitable_v1_appTableRecord_*` | 操作多维表格记录 |
| 知识库 | `wiki_v1_node_search` | 搜索知识库节点 |
| 权限 | `drive_v1_permissionMember_create` | 添加文档权限 |

---

## 三、脚本环境检测

### 3.1 Python 环境检测

```bash
# 检测 Python 是否可用
python3 --version

# 检测依赖库
python3 -c "import urllib.request; print('urllib OK')"
```

### 3.2 脚本参数解析测试

```bash
# 测试脚本能否正确解析参数
python3 scripts/send_feishu_message.py
# 期望：输出用法提示，退出码 1
```

---

## 四、网络与代理检测

```bash
# 检测代理配置
echo $HTTPS_PROXY

# 检测飞书 API 连通性
curl -I https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal --max-time 5
```

---

## 五、环境状态报告模板

```markdown
## 环境检测报告

### CLI 状态
- **状态**: ✅ 正常 / ⚠️ 需验证 / ❌ 不可用
- **身份**: user / bot
- **可用操作**: [文档创建, 文档读取, 文档搜索, 云空间操作]
- **限制操作**: [发送消息 - **禁止使用**]

### MCP 状态
- **状态**: ✅ 正常 / ⚠️ 工具缺失 / ❌ 不可用
- **服务状态**: 运行中 / 未启动 / 连接超时
- **可用工具**: [im_v1_message_create, im_v1_chat_list, ...]
- **缺失工具**: [bitable_v1_app_create, ...]

### 脚本状态
- **状态**: ✅ 正常 / ❌ 不可用
- **Python 版本**: 3.x.x
- **依赖库**: ✅ 完整 / ❌ 缺失

### 网络状态
- **代理配置**: http://127.0.0.1:18080
- **API 连通性**: ✅ 正常 / ❌ 异常

### 综合评估
- **环境类型**: 类型A / 类型B / ...
- **推荐工具顺序**: [根据环境类型确定]
- **可用操作列表**: [综合所有可用工具]
- **不可用操作列表**: [任何工具都无法执行的操作]
```

---

## 六、关键文件路径

| 用途 | 文件路径 |
|------|---------|
| MCP配置文件 | `/data/user/mcp/mcp-servers.json` |
| MCP客户端日志 | `/var/log/tool/agent-tool-host.stdout.log` |
| MCP服务stderr日志 | `/var/log/tool/mcp/lark-mcp.stderr.log` |
| Supervisor日志 | `/var/log/tool/supervisord.log` |

详见 [MCP 服务状态确认报告](file:///workspace/03-docs/reports/mcp-service-status-confirmation-report-20260515.md)。
