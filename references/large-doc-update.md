# 大文档全量更新操作指南

## 概述

本指南详细说明如何使用 lark-cli 对大于 50KB 的飞书文档进行全量更新。核心原则是**先清空后追加**，确保文档内容完全替换而非叠加。

## 整体流程

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   1. 清空文档    │ → │  1.1 验证清空   │ → │  2. 分块追加    │ → │  3. 验证完整性   │
│  (overwrite)    │    │  (fetch check)  │    │  (append × N)   │    │  (fetch check)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 详细操作步骤

### Step 1: 清空文档（overwrite 模式）

**目的**：将文档内容重置为空白，保留文档本身和权限设置

**指令**：
```bash
lark-cli docs +update --doc "DOC_ID" --mode overwrite --markdown " "
```

**注意事项**：
- ❌ 禁止使用 `--markdown ""`（空字符串可能导致 API 错误）
- ✅ 使用 `" "`（单个空格）是最安全的清空方式
- ⚠️ 此操作不可逆，确认文档 ID 正确后再执行

**验证清空成功**：
```bash
# 执行清空操作
lark-cli docs +update --doc "DOC_ID" --mode overwrite --markdown " "

# 验证文档确实为空（获取文档内容，应仅包含标题无正文内容）
lark-cli docs +fetch --doc "DOC_ID" 2>/dev/null
```

**验证标准**：
- ✅ 返回的 `content` 字段应为空或仅包含空格
- ✅ 返回的 `total_length` 应明显小于原文档大小（通常 < 100 字节）
- ✅ 如仍有大量内容，说明清空未成功，需重新执行

### Step 2: 分块追加（append 模式）

**目的**：将大文档内容分批写入，每批控制在 API 限制范围内

#### 分块策略

| 内容类型 | 建议块大小 | 说明 |
|---------|-----------|------|
| 普通文本 | < 30KB | 安全范围，一般可成功 |
| Markdown 表格 | < 8KB | 表格渲染消耗更多资源，需更小分块 |
| 代码块/复杂格式 | < 20KB | 格式标记会增加内容体积 |

#### 分块切割方法

**按行数切割（推荐）**：
```bash
# 提取前 237 行到 block1.md
head -237 source.md > block1.md

# 提取 238-1105 行到 block2.md
sed -n '238,1105p' source.md > block2.md

# 查看文件大小确认
wc -c block*.md
```

**关键原则**：
1. **表格不可切割**：Markdown 表格必须保持完整，不能从中间截断
2. **章节边界优先**：尽量在章节标题处切割，保持文档结构清晰
3. **逐级测试**：如果某块失败，继续减半再试

#### 大表格特殊处理

当遇到超大表格（如 410 行 × 7 列）时：

```bash
# 1. 提取表格标题和表头（第一段）
head -57 source.md > block_table_1.md

# 2. 为后续每一段添加独立表头
HEADER_LINE1="| 排名 | 帖子ID | 作品名称 | 作者 | 投票 | 类型 | 标签 |"
HEADER_LINE2="|------|--------|----------|------|------|------|------|"

# 3. 生成带表头的子块（使用 echo -e 确保换行符正确）
echo -e "${HEADER_LINE1}\n${HEADER_LINE2}\n$(sed -n '58,116p' source.md)" > block_table_2.md
```

**效果**：飞书会渲染为多个连续表格，视觉上保持连贯，数据完整无缺。

#### 执行分块追加

**指令模板**：
```bash
lark-cli docs +update --doc "DOC_ID" --mode append --markdown "$(cat blockN.md)"
```

### Step 3: 验证完整性

**目的**：确认所有内容已正确写入，无遗漏或格式错误

**指令**：
```bash
# 获取文档内容并检查关键标记
lark-cli docs +fetch --doc "DOC_ID" 2>/dev/null | grep -E "(关键词1|关键词2|关键词3)"

# 查看文档总长度
lark-cli docs +fetch --doc "DOC_ID" 2>/dev/null | wc -c
```

**验证要点**：
- ✅ 标题层级完整（#、##、###）
- ✅ 表格数据行数正确
- ✅ 关键章节存在
- ✅ 无乱码或格式错误

## 完整实战案例

### 场景：更新 94KB 大文档

```bash
# 1. 清空文档
lark-cli docs +update --doc "Se7Kdyjkzo9KiBxXjbyc9DZVnFd" \
  --mode overwrite --markdown " "

# 1.1 验证清空成功（total_length 应 < 100 字节）
lark-cli docs +fetch --doc "Se7Kdyjkzo9KiBxXjbyc9DZVnFd" 2>/dev/null | \
  grep '"total_length"'

# 2. 依次追加各块（共 11 次）
cd /workspace/飞书文档分块

# 块1：标题概览 + TOP 1-10 (8KB)
lark-cli docs +update --doc "Se7Kdyjkzo9KiBxXjbyc9DZVnFd" \
  --mode append --markdown "$(cat block1.md)"

# 块2：TOP 11-50 (30KB)
lark-cli docs +update --doc "Se7Kdyjkzo9KiBxXjbyc9DZVnFd" \
  --mode append --markdown "$(cat block2.md)"

# 块3-9：大表格分 7 段追加（每段约 8KB）
for f in block3_t2.md block3b_fixed.md block3c_fixed.md block3d_fixed.md \
         block3e_fixed.md block3f_fixed.md block3g_fixed.md; do
  lark-cli docs +update --doc "Se7Kdyjkzo9KiBxXjbyc9DZVnFd" \
    --mode append --markdown "$(cat $f)"
done

# 块10-11：统计和说明 (1KB + 1KB)
lark-cli docs +update --doc "Se7Kdyjkzo9KiBxXjbyc9DZVnFd" \
  --mode append --markdown "$(cat block4.md)"
lark-cli docs +update --doc "Se7Kdyjkzo9KiBxXjbyc9DZVnFd" \
  --mode append --markdown "$(cat block5.md)"

# 3. 验证
lark-cli docs +fetch --doc "Se7Kdyjkzo9KiBxXjbyc9DZVnFd" 2>/dev/null | \
  grep -E "(排名|帖子ID|活跃作者统计|数据验证说明)" | head -20
```

## 快速分块脚本模板

```bash
#!/bin/bash
# split_and_upload.sh - 大文档分块上传脚本

DOC_ID="YOUR_DOC_ID"
SOURCE_FILE="source.md"
CHUNK_SIZE=50  # 行数，根据实际情况调整

# 1. 清空文档
echo "清空文档..."
lark-cli docs +update --doc "$DOC_ID" --mode overwrite --markdown " "

# 1.1 验证清空成功
echo "验证清空..."
length=$(lark-cli docs +fetch --doc "$DOC_ID" 2>/dev/null | grep -o '"total_length":[0-9]*' | grep -o '[0-9]*')
if [ "$length" -gt 100 ]; then
    echo "警告：文档仍有 $length 字节内容，清空可能未成功"
    echo "建议重新执行清空操作"
    # exit 1  # 如需严格模式，可取消注释
fi
echo "清空验证通过 (total_length: $length)"

# 2. 计算总行数
total_lines=$(wc -l < "$SOURCE_FILE")
echo "总行数: $total_lines"

# 3. 分块上传
chunk_num=1
start_line=1
while [ $start_line -le $total_lines ]; do
    end_line=$((start_line + CHUNK_SIZE - 1))
    chunk_file="chunk_${chunk_num}.md"

    sed -n "${start_line},${end_line}p" "$SOURCE_FILE" > "$chunk_file"
    size=$(wc -c < "$chunk_file")

    echo "上传块 $chunk_num (行 $start_line-$end_line, $size 字节)..."
    lark-cli docs +update --doc "$DOC_ID" --mode append --markdown "$(cat $chunk_file)"

    start_line=$((end_line + 1))
    chunk_num=$((chunk_num + 1))
done

echo "完成！共上传 $((chunk_num - 1)) 个块"
```

## 最佳实践建议

1. **预先测试块大小**：在正式更新前，先测试单块能否成功
2. **保留分块文件**：将切割后的块文件保留在独立文件夹，便于问题排查、重复更新和团队协作
3. **文档重命名**：更新完成后，根据需要修改文档标题
4. **批量追加优化**：当需要追加多个块时，可合并为单次命令

## 禁止事项

| 禁止行为 | 后果 | 正确做法 |
|---------|------|---------|
| ❌ 直接删除文档重新创建 | 文档链接变化，权限丢失 | 使用 overwrite 清空保留文档 |
| ❌ 表格从中间切割 | 表格格式完全错乱 | 表格整体写入，或拆为多个独立表格 |
| ❌ 使用 `printf` 生成表头 | `\n` 被当作文本 | 使用 `echo -e` 或 heredoc |
| ❌ 单次追加 > 50KB 内容 | API 报错 | 控制每块 < 30KB（表格 < 8KB）|
| ❌ 不清空直接追加 | 新旧内容叠加混乱 | 先 overwrite 清空再 append |
| ❌ 不验证清空结果就追加 | 可能导致新旧内容混杂 | 必须用 fetch 确认 total_length < 100 后再追加 |
| ❌ 使用 `--mode replace_range` 批量替换 | 复杂且易出错 | 使用 overwrite + append 组合 |
