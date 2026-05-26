# feishu-mtc-ops

[English](#english) | 简体中文

&gt; 🚀 强大的飞书（Feishu/Lark）MTC 模式操作工具，为 Trae SOLO 量身打造

[![Version](https://img.shields.io/badge/version-v2.4.0-blue.svg)](https://github.com/sonicx999-wxs/feishu-mtc-ops)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Trae SOLO](https://img.shields.io/badge/Trae%20SOLO-MTC%20Mode-orange.svg)](https://solo.trae.cn/)

## ✨ 核心特性

🔍 **智能环境预检** - 自动检测 CLI、MCP、脚本环境状态，支持 7 种环境类型的智能适配

🔄 **智能降级机制** - 根据环境类型自动选择最优工具组合和降级路径

🐍 **Python 脚本支持** - MTC 环境高兼容的 Python 脚本发送消息，解决代理兼容性问题

📄 **大文档支持** - 支持 &gt;50KB 文档的分块上传，包含清空验证、分块策略、表格处理

## 📦 支持的操作

| 类别 | 功能 |
|------|------|
| 📄 文档 | 创建、读取、更新、搜索、媒体管理、大文档全量更新 |
| ☁️ 云空间 | 上传、下载、文件夹管理、导出、导入 |
| 💬 聊天 | 发送消息、获取记录、创建群聊 |
| 📊 表格 | 创建、读取、写入、追加 |
| 📚 知识库 | 搜索节点、创建节点 |
| 📋 多维表格 | 创建应用、增删改查 |
| 👥 通讯录 | 获取用户信息 |

## 🚀 快速开始

### 环境要求

- [Trae SOLO](https://solo.trae.cn/) (MTC 模式)
- [lark-cli](https://github.com/larksuite/cli) (可选)
- Python 3.x (可选)
- 飞书 MCP 配置

### 安装 Skill

1. **下载最新版**
   - 从 [Releases](https://github.com/sonicx999-wxs/feishu-mtc-ops/releases) 下载 `feishu-mtc-ops-v2.4.0.skill`

2. **安装到 Trae SOLO**
   - 打开 [Trae SOLO](https://solo.trae.cn/)
   - 进入「技能管理」→「上传技能」
   - 选择下载的 `.skill` 文件

### 使用 Skill

```
Use Skill: feishu-mtc-ops

然后直接说：
- "帮我创建一份周报文档"
- "发送消息到测试群"
- "在文件夹里新建一个表格"
```

## 📖 文档

- [SKILL.md](SKILL.md) - 完整技能文档
- [环境检测指南](references/environment-detection.md)
- [降级策略指南](references/degradation-strategy.md)
- [操作参考](references/operations.md)
- [大文档更新](references/large-doc-update.md)

## 📂 项目结构

```
feishu-mtc-ops/
├── SKILL.md                          # 主文档（路由层 + 环境预检 + 降级机制）
├── README.md                         # 项目说明
├── LICENSE                           # MIT 许可证
├── CHANGELOG.md                      # 版本更新记录
├── .gitignore                        # Git 忽略配置
│
├── scripts/                          # 可执行脚本
│   ├── feishu_send.sh                # Shell 脚本发送消息
│   ├── send_feishu_message.js        # Node.js 脚本发送消息
│   └── send_feishu_message.py        # Python 脚本发送消息（MTC高兼容）
│
├── references/                       # 参考文档
│   ├── operations.md                 # 详细操作参考
│   ├── quick-reference.md            # 快速参考卡
│   ├── error-handling.md             # 错误处理指南
│   ├── scenarios.md                  # 场景化工作流
│   ├── environment-detection.md       # 环境检测方法
│   ├── degradation-strategy.md       # 降级策略矩阵
│   └── large-doc-update.md           # 大文档全量更新
│
└── skill-packages/                   # 打包好的 .skill 文件
    └── feishu-mtc-ops-v2.4.0.skill
```

## 🔧 环境类型

支持 7 种环境类型的智能适配：

| 类型 | CLI | MCP | 脚本 | 说明 |
|------|-----|-----|------|------|
| A | ✅ | ✅ | ✅ | 全部可用（最优） |
| B | ✅ | ❌ | ✅ | CLI + 脚本 |
| C | ❌ | ✅ | ✅ | MCP + 脚本 |
| D | ❌ | ❌ | ✅ | 仅脚本 |
| E | ✅ | ❌ | ❌ | 仅 CLI |
| F | ❌ | ✅ | ❌ | 仅 MCP |
| G | ❌ | ❌ | ❌ | 全部不可用 |

## ⚠️ 注意事项

1. 飞书 MCP 自动注入凭证，无需 `config init` 或 `auth login`
2. lark-cli 自动以 user 身份运行，**不要**添加 `--as user` 或 `--as bot` 参数
3. MTC 模式下禁止使用 lark-cli 发送聊天消息（会触发身份验证中断）

## 📄 许可证

本项目采用 [MIT 许可证](LICENSE)。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📞 相关链接

- 🐛 [Bug 报告](https://github.com/sonicx999-wxs/feishu-mtc-ops/issues)
- 💡 [功能请求](https://github.com/sonicx999-wxs/feishu-mtc-ops/issues)
- 📖 [项目文档](https://github.com/sonicx999-wxs/feishu-mtc-ops/wiki)
- 💬 [讨论区](https://github.com/sonicx999-wxs/feishu-mtc-ops/discussions)

### 外部链接

- [飞书 CLI 官方文档](https://github.com/larksuite/cli)
- [Trae SOLO 官网](https://solo.trae.cn/)
- [飞书开放平台](https://open.feishu.cn/)

## 📊 版本历史

| 版本 | 日期 | 主要更新 |
|------|------|---------|
| **v2.4.0** | 2026-05-22 | 环境预检、智能降级、Python脚本支持、大文档支持 |
| v2.3.1 | 2026-05-18 | 修复命令参数格式 |
| v2.3.0 | 2026-05-xx | 自然语言意图解析、场景化工作流 |
| v2.2.0 | 2026-05-xx | 修正命令参数格式 |
| v2.1.0 | 2026-05-xx | 文件夹管理功能 |
| v2.0.0 | 2026-05-xx | 大版本重构，40+ 命令 |

&gt; 详细版本更新记录请参考 [CHANGELOG.md](CHANGELOG.md)

---

## English

# feishu-mtc-ops

&gt; 🚀 Powerful Feishu/Lark MTC Mode operation tool, tailored for Trae SOLO

### Features

- 🔍 **Smart Environment Detection** - Auto-detect CLI, MCP, and script environment status
- 🔄 **Intelligent Fallback** - Automatic tool selection and fallback based on environment type
- 🐍 **Python Script Support** - MTC environment compatible message sending
- 📄 **Large Document Support** - Chunked upload for documents &gt;50KB

### Quick Start

1. Download `feishu-mtc-ops-v2.4.0.skill` from releases
2. Upload to Trae SOLO → Skill Management
3. Say: "Use Skill: feishu-mtc-ops"

### Documentation

- [SKILL.md](SKILL.md) - Complete skill documentation
- [Environment Detection Guide](references/environment-detection.md)
- [Degradation Strategy Guide](references/degradation-strategy.md)

### License

MIT License - see [LICENSE](LICENSE) file for details.
