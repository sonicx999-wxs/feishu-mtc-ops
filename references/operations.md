# 飞书操作详细参考

## 一、文档操作

### 1.1 创建文档

#### 首选方案：飞书 CLI 命令

```bash
lark-cli docs +create --title "文档标题" --markdown "# 内容\n\n正文内容..."
```

**参数说明**：
- `--title`：文档标题
- `--markdown`：Markdown 格式内容

**成功判断**：返回 JSON 中 `ok: true` 且包含 `doc_id` 和 `doc_url`

> **注意**：`docs +create` 不支持直接指定文件夹。如需将文档放入指定文件夹，请先创建文档，再使用 `drive +move` 移动。

#### 备用方案：飞书 MCP 工具

```json
{
  "server_name": "mcp_lark-mcp",
  "tool_name": "docx_builtin_import",
  "args": {
    "data": {
      "file_name": "文档标题",
      "markdown": "# 内容\n\n正文内容..."
    },
    "useUAT": false
  }
}
```

成功后需要为用户添加文档权限。

---

### 1.2 获取文档内容

```bash
lark-cli docs +fetch --doc "文档ID或完整URL"
```

---

### 1.3 更新文档内容

#### 追加内容（append 模式）

```bash
lark-cli docs +update --doc "文档ID" --mode append --markdown "## 新章节\n\n追加的内容..."
```

#### 替换章节（replace_range 模式）

```bash
lark-cli docs +update --doc "文档ID" --mode replace_range --selection-by-title "## 旧章节" --markdown "## 新章节\n\n替换后的内容..."
```

#### 删除章节（delete_range 模式）

```bash
lark-cli docs +update --doc "文档ID" --mode delete_range --selection-by-title "## 要删除的章节"
```

#### 在指定位置插入

```bash
lark-cli docs +update --doc "文档ID" --mode insert_before --selection-with-ellipsis "目标内容" --markdown "插入的内容"
# 或
lark-cli docs +update --doc "文档ID" --mode insert_after --selection-with-ellipsis "目标内容" --markdown "插入的内容"
```

---

### 1.4 搜索文档

```bash
lark-cli docs +search --query "关键词" --page-size 10
```

---

### 1.5 插入图片/文件到文档

```bash
lark-cli docs +media-insert --doc "文档ID" --file "/本地文件路径.png"
```

**参数说明**：
- `--doc`：文档 ID 或 URL
- `--file`：本地文件路径（支持图片、附件等）
- `--type`：文件类型（可选，自动检测）

---

### 1.6 下载/预览文档媒体

```bash
lark-cli docs +media-download --doc "文档ID" --file-token "文件token" --output "/保存路径"
# 或预览
lark-cli docs +media-preview --doc "文档ID" --file-token "文件token"
```

---

## 二、云空间操作

### 2.1 上传文件

```bash
lark-cli drive +upload --file "/本地文件路径" --folder "文件夹token"
```

**参数说明**：
- `--file`：本地文件路径
- `--folder`：目标文件夹 token（可选，默认根目录）

---

### 2.2 下载文件

```bash
lark-cli drive +download --token "文件token" --output "/本地保存路径"
```

---

### 2.3 创建文件夹

```bash
lark-cli drive +create-folder --name "文件夹名称" --parent "父文件夹token"
```

---

### 2.4 移动文件/文件夹

```bash
lark-cli drive +move --file-token "文件token" --folder-token "目标文件夹token" --type "docx"
```

---

### 2.5 导出文档

```bash
lark-cli drive +export --token "文档token" --type "pdf" --output "/保存路径"
```

> **注意**：导出是异步操作，需要使用 `drive +task_result` 查询结果。

---

### 2.6 导入本地文件为云文档

```bash
lark-cli drive +import --file "/本地文件.docx" --folder "文件夹token"
```

---

### 2.7 添加文档评论

```bash
lark-cli drive +add-comment --token "文档token" --content "评论内容"
```

---

### 2.8 申请文档权限

```bash
lark-cli drive +apply-permission --token "文档token" --perm "edit" --remark "申请理由"
```

---

### 2.9 创建快捷方式

```bash
lark-cli drive +create-shortcut --file-token "源文件token" --folder-token "目标文件夹token" --type "docx"
```

---

### 2.10 查询异步任务结果

```bash
lark-cli drive +task_result --scenario "export" --ticket "任务ticket"
```

---

## 三、聊天操作

聊天操作应使用**应用身份**（useUAT: false）。

### 3.1 发送消息

```json
{
  "server_name": "mcp_lark-mcp",
  "tool_name": "im_v1_message_create",
  "args": {
    "data": {
      "receive_id": "聊天ID",
      "msg_type": "text",
      "content": "{\"text\":\"消息内容\"}"
    },
    "params": { "receive_id_type": "chat_id" }
  }
}
```

---

### 3.2 获取聊天列表

```json
{
  "server_name": "mcp_lark-mcp",
  "tool_name": "im_v1_chat_list",
  "args": { "data": { "count": 20 } }
}
```

---

### 3.3 获取聊天记录

```json
{
  "server_name": "mcp_lark-mcp",
  "tool_name": "im_v1_message_list",
  "args": {
    "params": {
      "container_id": "聊天ID",
      "container_id_type": "chat",
      "page_size": 20,
      "sort_type": "ByCreateTimeDesc"
    }
  }
}
```

---

### 3.4 创建群聊

```json
{
  "server_name": "mcp_lark-mcp",
  "tool_name": "im_v1_chat_create",
  "args": {
    "data": {
      "name": "群聊名称",
      "chat_mode": "group",
      "chat_type": "private"
    },
    "params": { "user_id_type": "open_id" }
  }
}
```

---

### 3.5 获取群成员列表

```json
{
  "server_name": "mcp_lark-mcp",
  "tool_name": "im_v1_chatMembers_get",
  "args": {
    "path": { "chat_id": "群聊ID" },
    "params": {
      "member_id_type": "open_id",
      "page_size": 50
    }
  }
}
```

**重要说明**：返回的 `open_id` 是 MCP 应用下的 open_id，可用于后续添加成员等操作。

---

### 3.6 添加群成员

> ⚠️ **关键**：必须使用 MCP 应用下的 open_id，不能使用 lark-cli 返回的 open_id

```json
{
  "server_name": "mcp_lark-mcp",
  "tool_name": "im_v1_chatMembers_create",
  "args": {
    "path": { "chat_id": "群聊ID" },
    "data": {
      "id_list": ["用户open_id"],
      "member_id_type": "open_id"
    }
  }
}
```

**常见错误**：
- `99992361 open_id cross app`：使用的 open_id 不是 MCP 应用下的
- `232011 Operator not in chat`：应用不在群聊中

---

### 3.7 生成群聊邀请链接

当无法通过 open_id 添加成员时，可以生成邀请链接让用户主动加入：

```json
{
  "server_name": "mcp_lark-mcp",
  "tool_name": "im_v1_chat_link_create",
  "args": {
    "path": { "chat_id": "群聊ID" },
    "data": {
      "validity_period": "week"
    }
  }
}
```

---

### 3.8 删除群聊

> ⚠️ **限制**：只有群聊创建者（应用身份）才能删除群聊

```json
{
  "server_name": "mcp_lark-mcp",
  "tool_name": "im_v1_chat_delete",
  "args": {
    "path": { "chat_id": "群聊ID" }
  }
}
```

---

### 3.9 发送消息（Python 脚本）

MTC 环境下推荐使用 Python 脚本发送消息，避免 Node.js 代理兼容性问题：

```bash
python3 scripts/send_feishu_message.py "群聊ID" "消息内容"
```

**脚本特性**：
- 自动从 `/data/user/mcp/mcp-servers.json` 读取凭证
- 从环境变量 `HTTPS_PROXY` 读取代理配置
- 使用 Python urllib 完美处理代理隧道

---

## 四、知识库操作

### 4.1 搜索知识库节点

```json
{
  "server_name": "mcp_lark-mcp",
  "tool_name": "wiki_v1_node_search",
  "args": {
    "data": {
      "query": "关键词",
      "space_id": "知识空间ID"
    },
    "params": { "page_size": 20 }
  }
}
```

---

### 4.2 获取知识库节点详情

```json
{
  "server_name": "mcp_lark-mcp",
  "tool_name": "wiki_v2_space_getNode",
  "args": {
    "params": {
      "token": "wiki节点token或文档token",
      "obj_type": "docx"
    }
  }
}
```

---

### 4.3 创建知识库节点

```bash
lark-cli wiki +node-create --space "知识空间ID" --parent "父节点token" --obj-type "docx" --obj-token "文档token"
```

---

## 五、电子表格操作

电子表格操作需要使用 `sheet_id`（工作表ID），格式为 `<sheetId>!A1:D10`。

### 5.1 创建电子表格

```bash
lark-cli sheets +create --title "表格名称"
```

---

### 5.2 获取表格信息（获取 sheet_id）

```bash
lark-cli sheets +info --spreadsheet-token "表格token"
```

---

### 5.3 读取单元格值

```bash
lark-cli sheets +read --spreadsheet-token "表格token" --range "<sheetId>!A1:C10"
```

---

### 5.4 写入单元格值

```bash
lark-cli sheets +write --spreadsheet-token "表格token" --range "<sheetId>!A1" --values '[["姓名","年龄"],["张三",25]]'
```

---

### 5.5 追加行数据

```bash
lark-cli sheets +append --spreadsheet-token "表格token" --range "<sheetId>!A:D" --values '[["李四",30]]'
```

---

## 六、多维表格操作

多维表格操作使用**应用身份**（useUAT: false）。

### 6.1 创建多维表格应用

```json
{
  "server_name": "mcp_lark-mcp",
  "tool_name": "bitable_v1_app_create",
  "args": {
    "data": {
      "name": "多维表格名称",
      "folder_token": "文件夹token"
    },
    "useUAT": false
  }
}
```

---

### 6.2 创建数据表

```json
{
  "server_name": "mcp_lark-mcp",
  "tool_name": "bitable_v1_appTable_create",
  "args": {
    "path": { "app_token": "多维表格token" },
    "data": {
      "table": {
        "name": "数据表名称",
        "default_view_name": "默认视图",
        "fields": [
          { "field_name": "姓名", "type": 1 },
          { "field_name": "年龄", "type": 2 }
        ]
      }
    },
    "useUAT": false
  }
}
```

字段类型（type）说明：1-多行文本、2-数字、3-单选、4-多选、5-日期、7-复选框、11-人员、15-超链接、17-附件。

---

### 6.3 列出数据表/字段

```json
{
  "server_name": "mcp_lark-mcp",
  "tool_name": "bitable_v1_appTable_list",
  "args": {
    "path": { "app_token": "多维表格token" },
    "useUAT": false
  }
}

{
  "server_name": "mcp_lark-mcp",
  "tool_name": "bitable_v1_appTableField_list",
  "args": {
    "path": {
      "app_token": "多维表格token",
      "table_id": "数据表ID"
    },
    "useUAT": false
  }
}
```

---

### 6.4 创建记录

```json
{
  "server_name": "mcp_lark-mcp",
  "tool_name": "bitable_v1_appTableRecord_create",
  "args": {
    "path": {
      "app_token": "多维表格token",
      "table_id": "数据表ID"
    },
    "data": { "fields": { "姓名": "张三", "年龄": 25 } },
    "useUAT": false
  }
}
```

---

### 6.5 搜索/更新记录

```json
{
  "server_name": "mcp_lark-mcp",
  "tool_name": "bitable_v1_appTableRecord_search",
  "args": {
    "path": {
      "app_token": "多维表格token",
      "table_id": "数据表ID"
    },
    "data": {
      "field_names": ["姓名", "年龄"],
      "filter": {
        "conjunction": "and",
        "conditions": [
          { "field_name": "年龄", "operator": "isGreater", "value": ["20"] }
        ]
      }
    },
    "params": { "page_size": 100 },
    "useUAT": false
  }
}

{
  "server_name": "mcp_lark-mcp",
  "tool_name": "bitable_v1_appTableRecord_update",
  "args": {
    "path": {
      "app_token": "多维表格token",
      "table_id": "数据表ID",
      "record_id": "记录ID"
    },
    "data": { "fields": { "年龄": 26 } },
    "useUAT": false
  }
}
```

---

## 七、通讯录操作

### 7.1 获取用户信息

```bash
lark-cli contact +get-user --user-id "用户open_id"
```

---

### 7.2 搜索用户

```bash
lark-cli contact +search-user --query "用户名或邮箱"
```

---

### 7.3 通过邮箱获取用户 ID

```json
{
  "server_name": "mcp_lark-mcp",
  "tool_name": "contact_v3_user_batchGetId",
  "args": {
    "data": { "emails": ["user@example.com"] },
    "params": { "user_id_type": "open_id" }
  }
}
```

---

## 八、权限管理

### 8.1 为用户添加文档权限

```json
{
  "server_name": "mcp_lark-mcp",
  "tool_name": "drive_v1_permissionMember_create",
  "args": {
    "data": {
      "token": "文档ID",
      "type": "file",
      "member_type": "openid",
      "member_id": "用户open_id",
      "perm": "full_access"
    }
  }
}
```

### 8.2 权限级别说明

| 权限级别 | 说明 | 使用场景 |
|---------|------|---------|
| `view` | 仅查看 | 只需要用户能查看文档 |
| `edit` | 可编辑 | 需要用户能编辑文档 |
| `full_access` | 可管理 | 需要用户能编辑、分享、删除文档 |
