# feishu-mtc-ops

**Author**: sonicx  
**Version**: v2.3.1  

---

## 项目简介

飞书 MTC（Model Context Protocol）模式操作技能，在 Trae SOLO MTC 模式下执行飞书全场景操作，默认使用用户身份，支持自动权限管理和备用方案切换。

本项目提供了一套完整的飞书操作解决方案，支持文档管理、聊天消息、云空间、表格等多种飞书功能。

---

## 📁 目录结构

```
feishu-mtc-ops/
├── 01-skill-source/          # Skill 源代码（开发用）
│   ├── v1/                   # lark-mtc-ops 早期版本（已归档）
│   │   ├── references/       # 参考文档
│   │   └── SKILL.md          # 技能定义文件
│   ├── v2/                   # feishu-mtc-ops 当前开发版
│   │   └── SKILL.md
│   └── v2-fixed/             # 修复版本备份
│       ├── references/
│       └── SKILL.md
│
├── 02-skill-packages/        # 打包好的 .skill 文件（安装用）
│   ├── feishu/               # feishu-mtc-ops v2.x 版本
│   └── lark/                 # lark-mtc-ops 旧版本（已归档）
│
├── 03-docs/                  # 文档资料
│   ├── competition/          # 参赛相关文档
│   ├── guides/               # 使用指南
│   └── reports/              # 测试报告
│
├── 04-references/            # 参考资料
│   └── ...
│
├── .trae/                    # Trae SOLO 配置
│   └── skills/
│
├── .gitignore                # Git 忽略配置
├── LICENSE                   # 许可证
└── README.md                 # 本文件
```

---

## 🚀 快速开始

### 安装最新版 Skill

1. 下载 `02-skill-packages/feishu/feishu-mtc-ops-v2.3.1.skill`
2. 打开 Trae SOLO → 技能管理 → 上传技能
3. 选择下载的 `.skill` 文件安装

### 使用 Skill

```
Use Skill: feishu-mtc-ops

然后直接说：
- "帮我创建一份周报文档"
- "发送消息到测试群"
- "在文件夹里新建一个表格"
```

---

## 📦 版本历史

| 版本 | 文件 | 主要更新 |
|------|------|---------|
| v2.3.1 | `feishu-mtc-ops-v2.3.1.skill` | 修复命令参数格式 |
| v2.3.0 | `feishu-mtc-ops-v2.3.0.skill` | 新增自然语言意图解析、场景化工作流、智能错误处理 |
| v2.2.0 | `feishu-mtc-ops-v2.2.0.skill` | 修正命令参数格式（drive +move, sheets 等） |
| v2.1.0 | `feishu-mtc-ops-v2.1.0.skill` | 新增文件夹管理功能 |
| v2.0.0 | `lark-mtc-ops-v2.0.skill` | 大版本重构，40+ 命令 |
| v1.1.0 | `lark-mtc-ops-v1.1.skill` | 修复聊天操作为 MCP |
| v1.0.0 | `lark-mtc-ops.skill` | 初始版本 |

---

## 📚 核心功能

### 支持的飞书操作

| 类别 | 功能 | 命令示例 |
|------|------|---------|
| 文档 | 创建、读取、更新、搜索 | `docs +create`, `docs +fetch` |
| 云空间 | 上传、下载、文件夹管理 | `drive +upload`, `drive +create-folder` |
| 聊天 | 发送消息、获取记录 | `im_v1_message_create` (MCP) |
| 表格 | 创建、读取、写入、追加 | `sheets +create`, `sheets +append` |
| 知识库 | 搜索节点、创建节点 | `wiki_v1_node_search` |
| 多维表格 | 创建应用、增删改查 | `bitable_v1_*` |
| 通讯录 | 获取用户信息 | `contact +get-user` |

### 特色功能

- ✅ **双身份智能切换**：user 身份（文档操作）+ 应用身份（聊天操作）
- ✅ **自动降级**：lark-cli 失败时自动 fallback 到 MCP 调用
- ✅ **自然语言支持**："帮我创建周报" → 自动执行命令
- ✅ **场景化工作流**：日报生成、会议纪要、数据报表等模板
- ✅ **智能错误处理**：自动捕获异常并切换备用方案

---

## ⚠️ MTC 模式特点

1. **凭证自动注入**：飞书 MCP 自动注入凭证，无需 `config init` 或 `auth login`
2. **固定 user 身份**：lark-cli 自动以 user 身份运行，**不要**添加 `--as user` 或 `--as bot` 参数
3. **配置命令不可用**：`config show`、`config init`、`auth login` 会返回 `external_provider` 错误，这是正常的

### 执行优先级

```
首选方案：lark-cli 命令（user 身份，文档归用户）
    ↓ 失败时
备用方案：run_mcp 调用飞书 MCP 工具（useUAT: false，文档归应用）
    ↓ 成功后
添加权限：为用户添加文档权限（drive_v1_permissionMember_create）
```

---

## 🔧 开发指南

### 修改 Skill

1. 编辑 `01-skill-source/v2/SKILL.md`
2. 修改版本号（YAML 头部）
3. 重新打包：将 SKILL.md 压缩为 `.skill` 文件
4. 移动到 `02-skill-packages/feishu/`

### 打包命令

```bash
cd 01-skill-source/v2
zip -r ../../02-skill-packages/feishu/feishu-mtc-ops-v2.x.x.skill SKILL.md
```

---

## 🐛 常见问题

### MCP 启动失败

**现象**：`Error: MCP server 'lark-mcp' initialization failed`

**解决**：
1. 检查 Trae 后台敏感变量：`LARKSUITE_CLI_APP_ID`, `LARKSUITE_CLI_APP_SECRET`
2. 确认 MCP 配置 JSON 使用正确的变量名
3. 重启 SOLO 会话

### 发送消息失败

**现象**：调用 `lark-cli im +messages-send` 失败

**解决**：
- 聊天操作必须使用 MCP（`im_v1_message_create`）
- 检查应用是否已添加到群聊

---

## 📞 相关链接

- 参赛帖子：https://forum.trae.cn/t/topic/17439
- 飞书 CLI 官方文档：https://github.com/larksuite/cli
- Trae SOLO 官网：https://solo.trae.cn/
- 飞书开放平台：https://open.feishu.cn/

---

## 📄 许可证

MIT License

---

*最后更新：2026-05-18*