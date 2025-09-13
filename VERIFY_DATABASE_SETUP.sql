-- 验证数据库表是否创建成功的SQL查询
-- 请在Supabase SQL编辑器中运行这些查询来检查数据库状态

-- 1. 检查所有必需的表是否存在
SELECT 
    table_name,
    CASE 
        WHEN table_name IN (
            'user_profiles',
            'user_target_domains', 
            'user_skills',
            'user_notification_settings',
            'user_preferences',
            'practice_sessions',
            'learning_stats'
        ) THEN '✅ 必需表'
        ELSE '❓ 其他表'
    END as table_status
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY 
    CASE 
        WHEN table_name IN (
            'user_profiles',
            'user_target_domains', 
            'user_skills',
            'user_notification_settings',
            'user_preferences',
            'practice_sessions',
            'learning_stats'
        ) THEN 1
        ELSE 2
    END,
    table_name;

-- 2. 检查缺失的表
SELECT 
    required_table,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = required_table
        ) THEN '✅ 存在'
        ELSE '❌ 缺失'
    END as status
FROM (
    VALUES 
        ('user_profiles'),
        ('user_target_domains'),
        ('user_skills'),
        ('user_notification_settings'),
        ('user_preferences'),
        ('practice_sessions'),
        ('learning_stats')
) AS required_tables(required_table)
ORDER BY required_table;

-- 3. 检查RLS策略是否创建
SELECT 
    schemaname,
    tablename,
    policyname,
    CASE 
        WHEN tablename IN (
            'user_profiles',
            'user_target_domains', 
            'user_skills',
            'user_notification_settings',
            'user_preferences',
            'practice_sessions',
            'learning_stats'
        ) THEN '✅ 必需表策略'
        ELSE '❓ 其他表策略'
    END as policy_status
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 4. 检查表结构 - user_preferences表
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'user_preferences'
ORDER BY ordinal_position;

-- 5. 检查索引是否创建
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN (
    'user_profiles',
    'user_target_domains', 
    'user_skills',
    'user_notification_settings',
    'user_preferences',
    'practice_sessions',
    'learning_stats'
)
ORDER BY tablename, indexname;

-- 6. 检查触发器是否创建
SELECT 
    trigger_schema,
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND event_object_table IN (
    'user_profiles',
    'user_target_domains', 
    'user_skills',
    'user_notification_settings',
    'user_preferences',
    'practice_sessions',
    'learning_stats'
)
ORDER BY event_object_table, trigger_name;

-- 7. 测试插入数据到user_preferences表（如果表存在）
-- 注意：这个查询只有在用户已登录且表存在时才会成功
-- INSERT INTO user_preferences (user_id, theme, language, timezone, difficulty_level)
-- VALUES (auth.uid(), 'light', 'zh-CN', 'Asia/Shanghai', 'intermediate');

-- 8. 查看当前用户的user_preferences数据（如果存在）
-- SELECT * FROM user_preferences WHERE user_id = auth.uid();

COMMIT;