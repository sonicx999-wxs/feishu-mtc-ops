# 错误处理与备用方案

## 常见错误及处理

| 错误信息 | 含义 | 自动处理方案 |
|---------|------|-------------|
| `user_access_token is invalid or expired` | 用户令牌过期 | 切换到飞书 MCP（useUAT: false） |
| `forbidden` 或错误码 1770032 | 无编辑权限 | 添加权限后重试 |
| `Access denied. One of the following scopes is required` | 应用缺少权限 | 提示用户在开发者后台开通权限 |
| `external_provider` | MTC 模式不支持配置命令 | 跳过配置，直接使用飞书 CLI 命令 |
| `--as bot is not supported` | 搜索不支持 bot 身份 | 使用 user 身份 |
| `permission denied` | 无操作权限 | 申请权限或切换身份 |
| `file not found` | 文件不存在 | 搜索确认文件位置 |
| `230027 Permission denied` | 用户身份无权限发送消息 | 使用应用身份脚本发送 |
| `232011 Operator not in chat` | 操作者不在目标群聊中 | 先加入群聊或使用应用身份 |
| `99992361 open_id cross app` | open_id 跨应用不通用 | 通过群成员列表获取正确的 open_id |
| `99992364 user id cross tenant` | 实际是跨应用问题 | 使用群成员列表获取正确 open_id |

---

## MCP 服务状态检测

当 MCP 服务不可用时，需要先检测状态再决定下一步操作。

### 检测方法

**方法1：进程检查（最直接）**
```bash
ps aux | grep -E "(lark-mcp|@larksuiteoapi)" | grep -v grep
```
**判断标准**：如果有 node 或 npm 进程在运行，说明服务已启动

**方法2：工具调用测试（最可靠）**
```bash
# 尝试调用 im_v1_chat_list 测试 MCP 工具是否可用
```

**方法3：日志检查（调试用）**
```bash
tail -20 /var/log/tool/mcp/lark-mcp.stderr.log
tail -20 /var/log/tool/agent-tool-host.stdout.log | grep -i "mcp.*tool"
```

### 关键文件路径

| 用途 | 文件路径 | 说明 |
|------|---------|------|
| MCP配置文件 | `/data/user/mcp/mcp-servers.json` | 服务配置 |
| MCP客户端日志 | `/var/log/tool/agent-tool-host.stdout.log` | 工具调用日志 |
| MCP服务stderr日志 | `/var/log/tool/mcp/lark-mcp.stderr.log` | 服务错误日志 |
| Supervisor日志 | `/var/log/tool/supervisord.log` | 进程管理日志 |

---

## 问题排查指南

### MCP 服务未运行

**检查步骤**：
1. 查看 `MCP stderr` 日志中的错误信息
2. 检查 `agent-tool-host stdout` 日志中的初始化失败记录
3. 验证配置文件 `/data/user/mcp/mcp-servers.json` 是否存在且格式正确

**常见错误及解决方案**：

| 错误信息 | 解决方案 |
|---------|---------|
| `Connection closed during: initialize response` | 服务启动超时，检查网络和凭证 |
| `libsecret-1.so.0: cannot open shared object file` | 可忽略的警告，不影响功能 |
| 进程立即退出 | stdio模式下无客户端连接（正常行为） |
| `Tool's name xxx is not available` | 检查工具名称格式，确认配置中的工具列表 |

### Node.js 代理兼容性问题

**症状**：通过代理调用 HTTPS API 时返回 HTML 而非 JSON

**解决方案**：使用 Python 脚本替代 Node.js 脚本
```bash
python3 scripts/send_feishu_message.py "群聊ID" "消息内容"
```

### Open_ID 跨应用问题

**症状**：调用 API 时返回错误码 99992361 或 99992364

**完整因果链**：
```
SOLO MTC 环境凭证注入
    ↓
lark-cli 使用应用 cli_a965abcba6fadbd3 的 user token
    ↓
用户 open_id 在应用 cli_a965abcba6fadbd3 下生成
    ↓
MCP 工具使用应用 cli_a9711cf63678dcc7 的 tenant token
    ↓
两个应用的 open_id 不通用（飞书安全机制）
    ↓
❌ 操作失败：open_id cross app
```

**解决方案**：
1. 通过群成员列表获取用户在 MCP 应用下的 open_id
2. 使用正确的 open_id 重新执行操作
3. 如果无法获取，生成群聊邀请链接让用户加入

---

## Open_ID 跨应用处理

### 问题说明

在 SOLO MTC 环境中，存在两个不同的飞书应用：

| 属性 | lark-cli（平台预设） | MCP 服务器（用户配置） |
|------|---------------------|----------------------|
| 应用 ID | `cli_a965abcba6fadbd3` | `cli_a9711cf63678dcc7` |
| 用户 open_id | 不同 | 不同 |
| 用户 union_id | 相同 | 相同 |
| 租户 | 相同 | 相同 |

**关键发现**：
- ✅ 用户和应用在同一租户（tenant_key 相同）
- ✅ union_id 在两个应用下完全相同
- ❌ open_id 在两个应用下不同（飞书的 open_id 是应用维度的）

### 解决方案

**获取用户 open_id 的推荐流程**：

```
1. 尝试 MCP contact 工具（需 contact:user.id:readonly 权限）
   └── 成功 → 直接获取用户在 MCP 应用下的 open_id
   └── 失败 → 进入步骤 2

2. 遍历机器人所在群聊的成员列表
   └── GET /im/v1/chats/{chat_id}/members?member_id_type=open_id
   └── 匹配用户名 → 获取 open_id
   └── 成功 → 缓存结果，后续直接使用
   └── 失败 → 进入步骤 3

3. 生成群聊邀请链接
   └── POST /im/v1/chats/{chat_id}/link
   └── 用户点击加入后，回到步骤 2
```

### 权限矩阵

| 操作 | lark-cli (user) | MCP (app) | 说明 |
|------|-----------------|-----------|------|
| 获取群列表 | ✅ | ✅ | 两者都能看到群聊 |
| 获取群信息 | ❌ 232011 | ✅ | user 不在群中 |
| 发送消息 | ❌ 230027 | ✅（脚本） | user 无权限 |
| 添加成员 | ❌ 232011 | ✅（需正确 open_id） | app 需使用 MCP 应用下的 open_id |
| 删除群聊 | ❌ | ✅ | app 是群创建者时可删除 |

---

## 智能错误处理流程

```
当操作失败时，AI 自动执行以下逻辑：

┌─────────────────────────────────────────────────────────────┐
│                      智能错误处理流程                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. 分析错误类型                                             │
│     │                                                        │
│     ├─ 令牌过期/无效                                        │
│     │   └─→ 自动切换到 MCP（useUAT: false）                  │
│     │      └─→ 成功后为用户添加权限                           │
│     │                                                        │
│     ├─ 权限不足                                              │
│     │   └─→ 尝试添加权限                                     │
│     │      └─→ 重试原操作                                    │
│     │                                                        │
│     ├─ 缺少 scope                                            │
│     │   └─→ 提供权限申请链接                                 │
│     │      └─→ 等待用户完成后再重试                          │
│     │                                                        │
│     └─ 其他错误                                              │
│         └─→ 记录错误，提供详细说明                           │
│            └─→ 询问用户是否尝试备用方案                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 备用方案执行流程

```
┌─────────────────────────────────────────────────────────────┐
│                    操作执行流程                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. 尝试首选方案（飞书 CLI）                                  │
│     ├── 成功 → 返回结果，结束                                 │
│     └── 失败 → 分析错误，进入步骤 2                           │
│                                                             │
│  2. 分析错误类型                                             │
│     ├── 令牌过期 → 执行步骤 3A                               │
│     ├── 权限不足 → 执行步骤 3B                               │
│     └── 其他错误 → 执行步骤 3A                               │
│                                                             │
│  3A. 切换到飞书 MCP（useUAT: false）                         │
│     ├── 成功 → 为用户添加权限 → 返回结果                      │
│     └── 失败 → 提示用户检查配置                               │
│                                                             │
│  3B. 添加权限后重试首选方案                                   │
│     ├── 成功 → 返回结果                                       │
│     └── 失败 → 执行步骤 3A                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```
