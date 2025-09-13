-- 🚨 紧急数据库修复脚本
-- 基于最新错误日志的综合修复方案

-- ========================================
-- 问题1: profiles表的email字段约束问题
-- ========================================

-- 检查profiles表结构
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 如果profiles表的email字段不允许null，但应用试图插入null值
-- 我们需要修改约束或确保应用提供email值

-- 方案A: 允许email字段为空（推荐）
ALTER TABLE profiles ALTER COLUMN email DROP NOT NULL;

-- 方案B: 为email字段设置默认值
-- ALTER TABLE profiles ALTER COLUMN email SET DEFAULT '';

-- ========================================
-- 问题2: 缺失的表 - user_profiles 和 user_notification_settings
-- ========================================

-- 检查哪些表真正存在
SELECT table_name, 'exists' as status
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name IN (
    'profiles',
    'user_profiles', 
    'user_notification_settings',
    'user_preferences',
    'user_target_domains',
    'user_skills',
    'practice_sessions',
    'learning_stats'
)
ORDER BY table_name;

-- 创建缺失的user_profiles表（如果不存在）
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255),
    avatar_url TEXT,
    bio TEXT,
    location VARCHAR(255),
    website VARCHAR(255),
    linkedin_url VARCHAR(255),
    github_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 创建缺失的user_notification_settings表（如果不存在）
CREATE TABLE IF NOT EXISTS user_notification_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    practice_reminders BOOLEAN DEFAULT true,
    weekly_reports BOOLEAN DEFAULT true,
    achievement_alerts BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 创建缺失的user_preferences表（如果不存在）
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    theme VARCHAR(20) DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
    language VARCHAR(10) DEFAULT 'zh-CN' CHECK (language IN ('zh-CN', 'en-US')),
    timezone VARCHAR(50) DEFAULT 'Asia/Shanghai',
    difficulty_level VARCHAR(20) DEFAULT 'intermediate' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- ========================================
-- 启用RLS并创建策略
-- ========================================

-- 为user_profiles启用RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 为user_notification_settings启用RLS
ALTER TABLE user_notification_settings ENABLE ROW LEVEL SECURITY;

-- 为user_preferences启用RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- 删除可能存在的旧策略
DROP POLICY IF EXISTS "Users can manage own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can manage own notification settings" ON user_notification_settings;
DROP POLICY IF EXISTS "Users can manage own preferences" ON user_preferences;

-- 创建RLS策略
CREATE POLICY "Users can manage own profile" ON user_profiles
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own notification settings" ON user_notification_settings
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own preferences" ON user_preferences
    FOR ALL USING (auth.uid() = user_id);

-- ========================================
-- 创建索引
-- ========================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notification_settings_user_id ON user_notification_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- ========================================
-- 创建更新时间戳触发器
-- ========================================

-- 确保update_updated_at_column函数存在
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 创建触发器
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_notification_settings_updated_at ON user_notification_settings;
CREATE TRIGGER update_user_notification_settings_updated_at 
    BEFORE UPDATE ON user_notification_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at 
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 验证修复结果
-- ========================================

-- 1. 验证所有表都存在
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
        ('profiles'),
        ('user_profiles'),
        ('user_notification_settings'),
        ('user_preferences'),
        ('user_target_domains'),
        ('user_skills'),
        ('practice_sessions'),
        ('learning_stats')
) AS required_tables(required_table)
ORDER BY required_table;

-- 2. 验证RLS策略
SELECT 
    tablename,
    policyname,
    '✅ 策略已创建' as status
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('user_profiles', 'user_notification_settings', 'user_preferences')
ORDER BY tablename, policyname;

-- 3. 验证profiles表的email字段约束
SELECT 
    column_name,
    is_nullable,
    CASE 
        WHEN is_nullable = 'YES' THEN '✅ 允许NULL'
        ELSE '⚠️ 不允许NULL'
    END as email_constraint_status
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'profiles'
AND column_name = 'email';

COMMIT;

-- 完成提示
SELECT '🎉 数据库紧急修复完成！请重启开发服务器并清除浏览器缓存。' as message;