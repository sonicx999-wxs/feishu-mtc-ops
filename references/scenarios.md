# 场景化工作流

## 场景 1：每日日报自动生成与推送

**需求**：每天早上自动生成日报，保存到飞书并发送通知

```bash
# 步骤 1：创建日报文档
lark-cli docs +create --title "$(date '+%Y-%m-%d') 日报" --markdown "
# 今日工作

（自动生成）

# 明日计划

（自动生成）
"

# 步骤 2：移动到日报文件夹
lark-cli drive +move --file-token "文档ID" --folder-token "日报文件夹token" --type "docx"

# 步骤 3：发送通知
# 使用 MCP 发送消息到用户
```

**完整流程**：
```
1. WebSearch(今日科技/行业新闻)
2. AI 整理生成日报内容
3. 创建飞书文档
4. 移动到指定文件夹
5. 发送飞书消息通知用户
```

---

## 场景 2：会议纪要快速整理

**需求**：从群聊记录提取关键信息，生成纪要并存入知识库

```bash
# 步骤 1：获取群聊记录
# im_v1_message_list 获取最近消息

# 步骤 2：AI 提取关键信息并生成纪要

# 步骤 3：创建纪要文档
lark-cli docs +create --title "会议纪要-XXX" --markdown "..."

# 步骤 4：存入知识库
lark-cli wiki +node-create --space "知识空间ID" --obj-token "文档ID"
```

---

## 场景 3：数据报表自动化更新

**需求**：定期从数据库提取数据，生成报表并存入飞书表格

```bash
# 步骤 1：获取/创建电子表格
lark-cli sheets +create --title "销售报表"
# 或：lark-cli docs +search --query "销售报表"

# 步骤 2：获取 sheet_id
lark-cli sheets +info --spreadsheet-token "表格token"

# 步骤 3：写入数据
lark-cli sheets +write --spreadsheet-token "表格token" --range "0841af!A1:D10" --values '[[...]]'

# 步骤 4：追加新数据
lark-cli sheets +append --spreadsheet-token "表格token" --range "0841af!A:D" --values '[[...]]'
```

---

## 场景 4：文档批量处理

**需求**：批量将本地 Markdown 文件上传到飞书指定文件夹

```bash
# 遍历本地文件
for file in *.md; do
  # 导入为飞书文档
  lark-cli drive +import --file "./$file" --type docx
done

# 移动到目标文件夹
lark-cli drive +move --file-token "文件token" --folder-token "目标文件夹" --type "docx"
```

---

## 场景 5：定时任务自动播报

**需求**：每天定时推送资讯简报到飞书群

```bash
# 在定时任务中执行：
# 1. 搜索最新资讯
# lark-cli docs +search --query "AI"

# 2. 生成简报
# AI 整理内容

# 3. 创建文档
lark-cli docs +create --title "每日简报-$(date '+%Y-%m-%d')" --markdown "..."

# 4. 发送群消息（使用 MCP）
# im_v1_message_create 发送通知到群
```
