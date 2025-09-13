# 🚨 紧急数据库修复指南

## 问题分析

根据最新的错误日志，我们发现了以下关键问题：

### 1. 数据库表缺失问题
- ❌ `user_profiles` 表不存在
- ❌ `user_notification_settings` 表不存在
- ⚠️ `user_preferences` 表可能存在但有问题

### 2. 数据约束问题
- ❌ `profiles` 表的 `email` 字段不允许 NULL 值，但应用尝试插入 NULL
- 错误代码：`23502` - null value in column "email" violates not-null constraint

### 3. 认证问题
- ❌ Cookie 解析失败：`SyntaxError: Unexpected token 'b', "base64-eyJ"...`

## 🔧 立即修复步骤

### 步骤 1: 执行紧急数据库修复

1. **打开 Supabase 控制台**
   - 访问 [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - 选择你的项目
   - 进入 "SQL Editor"

2. **执行修复脚本**
   - 复制 `CRITICAL_DATABASE_FIXES.sql` 文件的全部内容
   - 粘贴到 SQL Editor 中
   - 点击 "Run" 执行

3. **验证修复结果**
   - 脚本会自动显示验证结果
   - 确保所有表都显示 "✅ 存在"
   - 确保 email 字段显示 "✅ 允许NULL"

### 步骤 2: 清除缓存并重启

1. **清除浏览器缓存**
   ```
   - 按 Ctrl + Shift + Delete
   - 选择 "缓存的图像和文件"
   - 点击 "清除数据"
   ```

2. **重启开发服务器**
   - 在终端中按 `Ctrl + C` 停止当前服务器
   - 运行 `npm run dev` 重新启动

### 步骤 3: 验证修复效果

访问以下页面确认问题已解决：
- ✅ 用户资料页面 (`/profile`)
- ✅ 设置页面 (`/settings`)
- ✅ 练习记录页面 (`/practice-history`)

## 🔍 问题根本原因

### 1. 表结构不完整
- 之前的数据库脚本可能没有完全执行成功
- 某些表创建失败但没有报错

### 2. 数据约束过严
- `profiles` 表的 `email` 字段设置为 NOT NULL
- 但应用在某些情况下会尝试插入空值

### 3. Schema 缓存问题
- Supabase 的 schema 缓存可能没有及时更新
- 需要重启服务器来刷新缓存

## 📋 修复内容详情

### 数据库表修复
- ✅ 创建 `user_profiles` 表
- ✅ 创建 `user_notification_settings` 表
- ✅ 确保 `user_preferences` 表存在
- ✅ 修复 `profiles` 表的 email 约束

### 安全策略修复
- ✅ 启用所有表的 RLS (Row Level Security)
- ✅ 创建用户访问控制策略
- ✅ 确保用户只能访问自己的数据

### 性能优化
- ✅ 创建必要的数据库索引
- ✅ 添加自动更新时间戳触发器

## ⚠️ 注意事项

1. **备份重要数据**
   - 在执行修复前，确保重要数据已备份

2. **环境变量检查**
   - 确保 `.env.local` 中的数据库连接信息正确
   - 检查 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. **Cookie 问题**
   - 如果仍有 cookie 解析错误，清除所有浏览器数据
   - 重新登录应用

## 🆘 如果问题仍然存在

如果执行修复后问题仍然存在，请提供以下信息：

1. **数据库验证结果**
   - 修复脚本最后的验证输出

2. **新的错误日志**
   - 浏览器控制台的最新错误信息

3. **环境信息**
   - Node.js 版本
   - npm 版本
   - 操作系统

## 📞 联系支持

如需进一步帮助，请提供：
- 修复脚本的执行结果截图
- 最新的错误日志
- Supabase 项目的表结构截图

---

**预期结果**: 修复完成后，所有页面应该能正常加载，不再出现表不存在或约束违反的错误。