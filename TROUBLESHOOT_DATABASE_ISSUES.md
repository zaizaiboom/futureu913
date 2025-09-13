# 🔧 数据库问题故障排除指南

## 🚨 当前问题分析

从错误日志可以看到，即使执行了 `complete-database-fix.sql` 脚本，应用仍然报告：
```
用户偏好设置不存在，使用默认设置: Could not find the table 'public.user_preferences' in the schema cache
```

这表明可能存在以下问题之一：

## 🔍 问题诊断步骤

### 步骤1：验证数据库脚本是否成功执行

1. **登录Supabase控制台**
   - 访问 [Supabase Dashboard](https://supabase.com/dashboard)
   - 选择你的项目
   - 进入 "SQL Editor"

2. **运行验证查询**
   - 复制 `VERIFY_DATABASE_SETUP.sql` 文件的内容
   - 在SQL编辑器中粘贴并执行
   - 查看结果，确认所有必需的表都显示为 "✅ 存在"

### 步骤2：检查脚本执行结果

如果验证查询显示表缺失，说明脚本执行有问题：

**可能的原因：**
- 脚本执行时出现错误但被忽略
- 选择了错误的数据库项目
- 权限不足
- 脚本内容不完整

**解决方案：**
1. 重新执行 `complete-database-fix.sql` 脚本
2. 仔细查看执行结果，确保没有错误信息
3. 确认在正确的Supabase项目中执行

### 步骤3：检查环境变量配置

即使表存在，如果环境变量配置错误，应用也无法连接到正确的数据库：

1. **检查 `.env.local` 文件**
   ```bash
   # 确保这些变量指向正确的Supabase项目
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

2. **验证项目URL和密钥**
   - 在Supabase控制台的 "Settings" → "API" 中找到正确的值
   - 确保URL和密钥匹配当前项目

### 步骤4：清除缓存并重启

1. **停止开发服务器**
   ```bash
   # 在终端中按 Ctrl+C
   ```

2. **清除Next.js缓存**
   ```bash
   rm -rf .next
   npm run build
   ```

3. **重启开发服务器**
   ```bash
   npm run dev
   ```

## 🛠️ 常见问题及解决方案

### 问题1：脚本执行时出现权限错误

**错误信息：** `permission denied` 或 `insufficient privileges`

**解决方案：**
- 确保使用的是项目所有者账号
- 检查Supabase项目的访问权限
- 尝试使用服务角色密钥而不是匿名密钥

### 问题2：表创建成功但RLS策略失败

**错误信息：** `policy already exists` 或 `function auth.uid() does not exist`

**解决方案：**
1. 删除现有策略：
   ```sql
   DROP POLICY IF EXISTS "Users can manage own preferences" ON user_preferences;
   ```
2. 重新创建策略
3. 确保启用了Supabase Auth

### 问题3：表存在但应用仍然报错

**可能原因：**
- 环境变量指向错误的数据库
- Supabase客户端缓存问题
- 网络连接问题

**解决方案：**
1. 验证环境变量
2. 重启应用
3. 检查网络连接
4. 查看浏览器开发者工具的网络标签页

### 问题4：部分表创建成功，部分失败

**解决方案：**
1. 运行验证查询确定哪些表缺失
2. 手动创建缺失的表：
   ```sql
   -- 例如，如果只有user_preferences表缺失
   CREATE TABLE IF NOT EXISTS user_preferences (
       id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
       user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
       theme VARCHAR(20) DEFAULT 'light',
       language VARCHAR(10) DEFAULT 'zh-CN',
       timezone VARCHAR(50) DEFAULT 'Asia/Shanghai',
       difficulty_level VARCHAR(20) DEFAULT 'intermediate',
       created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
       updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

## 🔄 完整重置方案

如果上述方法都无效，可以尝试完全重置：

### 方案A：删除并重新创建表

```sql
-- 警告：这将删除所有数据！
DROP TABLE IF EXISTS learning_stats CASCADE;
DROP TABLE IF EXISTS practice_sessions CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS user_notification_settings CASCADE;
DROP TABLE IF EXISTS user_skills CASCADE;
DROP TABLE IF EXISTS user_target_domains CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- 然后重新执行 complete-database-fix.sql
```

### 方案B：创建新的Supabase项目

1. 在Supabase控制台创建新项目
2. 更新 `.env.local` 中的环境变量
3. 执行 `complete-database-fix.sql` 脚本
4. 重启应用

## 📞 获取更多帮助

如果问题仍然存在，请提供以下信息：

1. **验证查询结果** - `VERIFY_DATABASE_SETUP.sql` 的执行结果
2. **环境变量** - `.env.local` 文件内容（隐藏敏感信息）
3. **错误日志** - 完整的错误消息和堆栈跟踪
4. **Supabase项目信息** - 项目URL和区域
5. **执行步骤** - 你已经尝试过的解决方案

---

**提示：** 大多数情况下，问题出现在脚本执行不完整或环境变量配置错误。请仔细检查这两个方面。