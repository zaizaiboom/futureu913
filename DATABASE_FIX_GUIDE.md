# 数据库修复指南

## 🚨 重要提示

从错误日志中可以看到以下数据库表缺失的问题：
- `user_profiles` - 用户资料表
- `user_target_domains` - 用户目标领域表
- `user_skills` - 用户技能表
- `user_notification_settings` - 用户通知设置表
- `user_preferences` - 用户偏好设置表
- `practice_sessions` - 练习记录表
- `learning_stats` - 学习统计表

## 📋 修复步骤

### 步骤1：登录Supabase控制台

1. 打开 [Supabase控制台](https://supabase.com/dashboard)
2. 选择你的项目
3. 点击左侧菜单中的 "SQL Editor"

### 步骤2：执行数据库修复脚本

1. 在SQL编辑器中，复制并粘贴 `complete-database-fix.sql` 文件的全部内容
2. 点击 "Run" 按钮执行脚本
3. 确认所有语句都成功执行，没有错误

### 步骤3：验证表创建

在SQL编辑器中运行以下查询来验证表是否创建成功：

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'user_profiles',
    'user_target_domains', 
    'user_skills',
    'user_notification_settings',
    'user_preferences',
    'practice_sessions',
    'learning_stats'
)
ORDER BY table_name;
```

应该返回7行结果，包含所有表名。

### 步骤4：验证RLS策略

运行以下查询来验证RLS策略是否创建成功：

```sql
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### 步骤5：重启开发服务器

在终端中停止当前的开发服务器（Ctrl+C），然后重新启动：

```bash
npm run dev
```

## ✅ 验证修复结果

修复完成后，以下功能应该正常工作：

1. **用户资料页面** (`/profile`)
   - 显示用户基本信息
   - 目标领域和技能标签管理
   - 练习统计数据

2. **设置页面** (`/settings`)
   - 用户资料编辑
   - 通知设置
   - 偏好设置

3. **练习记录页面** (`/practice-history`)
   - 显示历史练习记录
   - 练习统计图表

4. **学习报告页面** (`/learning-report`)
   - 学习进度统计
   - 成绩分析

## 🐛 常见问题

### 问题1："table does not exist" 错误

**解决方案：**
- 确认已完整执行 `complete-database-fix.sql` 脚本
- 检查Supabase项目是否正确
- 验证环境变量配置

### 问题2："permission denied" 错误

**解决方案：**
- 确认RLS策略已正确创建
- 检查用户认证状态
- 验证策略中的 `auth.uid()` 函数

### 问题3：Cookie解析错误

**解决方案：**
- 已修复 `lib/supabase/server.ts` 中的cookie处理
- 重启开发服务器
- 清除浏览器缓存和cookie

## 📞 获取帮助

如果修复后仍有问题，请提供：
1. 具体的错误消息
2. 浏览器控制台日志
3. Supabase SQL编辑器的执行结果
4. 当前访问的页面URL

---

**最后更新：** 2024年1月  
**状态：** 已修复所有已知问题，等待用户执行数据库脚本