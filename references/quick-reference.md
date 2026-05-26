# 飞书 MTC 操作快速参考

## 自然语言操作指南

| 你说 | AI 执行 |
|------|---------|
| "帮我创建一份周报" | `docs +create` → 返回文档链接 |
| "把这份文档放到工作文件夹" | `drive +move` → 移动到文件夹 |
| "搜索关于 AI 的文档" | `docs +search` → 返回搜索结果 |
| "给产品组发条消息" | MCP `im_v1_message_create` |
| "在表格里追加一行数据" | `sheets +append` → 写入数据 |

---

## 飞书 CLI 命令（文档/云空间操作首选）

| 操作 | 命令 |
|------|------|
| 创建文档 | `lark-cli docs +create --title "标题" --markdown "内容"` |
| 获取文档 | `lark-cli docs +fetch --doc "文档ID"` |
| 追加内容 | `lark-cli docs +update --doc "文档ID" --mode append --markdown "内容"` |
| 替换章节 | `lark-cli docs +update --doc "文档ID" --mode replace_range --selection-by-title "## 章节" --markdown "新内容"` |
| 删除章节 | `lark-cli docs +update --doc "文档ID" --mode delete_range --selection-by-title "## 章节"` |
| 搜索文档 | `lark-cli docs +search --query "关键词"` |
| 插入图片 | `lark-cli docs +media-insert --doc "文档ID" --file "本地路径"` |
| 下载媒体 | `lark-cli docs +media-download --doc "文档ID" --file-token "token"` |
| 上传文件 | `lark-cli drive +upload --file "本地路径" --folder-token "文件夹token"` |
| 下载文件 | `lark-cli drive +download --file-token "文件token" --output "保存路径"` |
| 创建文件夹 | `lark-cli drive +create-folder --name "名称"` |
| 移动文件 | `lark-cli drive +move --file-token "文件token" --folder-token "目标token" --type "docx"` |
| 导出文档 | `lark-cli drive +export --file-token "文档token" --type "pdf"` |
| 导入文件 | `lark-cli drive +import --file "本地路径"` |
| 添加评论 | `lark-cli drive +add-comment --file-token "文档token" --content "评论"` |
| 申请权限 | `lark-cli drive +apply-permission --file-token "文档token" --perm "edit"` |
| 创建快捷方式 | `lark-cli drive +create-shortcut --file-token "源token" --folder-token "目标token"` |
| 查询任务 | `lark-cli drive +task_result --scenario "export" --ticket "ticket"` |
| 创建知识库节点 | `lark-cli wiki +node-create --space "空间ID" --obj-token "文档token"` |
| 创建表格 | `lark-cli sheets +create --title "名称"` |
| 获取表格信息 | `lark-cli sheets +info --spreadsheet-token "表格token"` |
| 读取单元格 | `lark-cli sheets +read --spreadsheet-token "表格token" --range "<sheetId>!A1:C10"` |
| 写入单元格 | `lark-cli sheets +write --spreadsheet-token "表格token" --range "<sheetId>!A1" --values '[[...]]'` |
| 追加行 | `lark-cli sheets +append --spreadsheet-token "表格token" --range "<sheetId>!A:D" --values '[[...]]'` |
| 获取用户 | `lark-cli contact +get-user --user-id "open_id"` |
| 搜索用户 | `lark-cli contact +search-user --query "关键词"` |

---

## run_mcp 调用（聊天操作首选 / 文档操作备用）

| 操作 | tool_name | 关键参数 |
|------|-----------|---------|
| 创建文档（备用） | `docx_builtin_import` | `data.file_name`, `data.markdown`, `useUAT: false` |
| 获取文档（备用） | `docx_v1_document_rawContent` | `path.document_id` |
| 搜索文档（备用） | `docx_builtin_search` | `data.search_key`, `useUAT: true` |
| 发送消息（首选） | `im_v1_message_create` | `data.receive_id`, `data.msg_type`, `data.content` |
| 获取聊天记录（首选） | `im_v1_message_list` | `params.container_id`, `params.container_id_type` |
| 获取聊天列表（首选） | `im_v1_chat_list` | `data.count` |
| 创建群聊（首选） | `im_v1_chat_create` | `data.name`, `data.chat_mode` |
| 获取群成员（首选） | `im_v1_chatMembers_get` | `path.chat_id` |
| 搜索知识库（首选） | `wiki_v1_node_search` | `data.query`, `data.space_id` |
| 获取知识库节点（首选） | `wiki_v2_space_getNode` | `params.token`, `params.obj_type` |
| 创建多维表格 | `bitable_v1_app_create` | `data.name`, `useUAT: false` |
| 创建数据表 | `bitable_v1_appTable_create` | `path.app_token`, `data.table` |
| 列出数据表 | `bitable_v1_appTable_list` | `path.app_token` |
| 列出字段 | `bitable_v1_appTableField_list` | `path.app_token`, `path.table_id` |
| 创建记录 | `bitable_v1_appTableRecord_create` | `path.app_token`, `path.table_id`, `data.fields` |
| 搜索记录 | `bitable_v1_appTableRecord_search` | `path.app_token`, `path.table_id` |
| 更新记录 | `bitable_v1_appTableRecord_update` | `path.app_token`, `path.table_id`, `path.record_id` |
| 添加权限 | `drive_v1_permissionMember_create` | `data.token`, `data.member_id`, `data.perm` |
| 获取用户ID | `contact_v3_user_batchGetId` | `data.emails`, `params.user_id_type` |
