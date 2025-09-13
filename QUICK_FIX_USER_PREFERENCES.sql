-- 快速修复 user_preferences 表的脚本
-- 如果complete-database-fix.sql执行后仍然出现user_preferences表不存在的错误，请运行此脚本

-- 1. 检查user_preferences表是否存在
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_preferences'
    ) THEN
        RAISE NOTICE 'user_preferences表不存在，正在创建...';
        
        -- 创建user_preferences表
        CREATE TABLE user_preferences (
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
        
        RAISE NOTICE 'user_preferences表创建成功';
    ELSE
        RAISE NOTICE 'user_preferences表已存在';
    END IF;
END $$;

-- 2. 启用RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- 3. 删除可能存在的旧策略
DROP POLICY IF EXISTS "Users can manage own preferences" ON user_preferences;

-- 4. 创建RLS策略
CREATE POLICY "Users can manage own preferences" ON user_preferences
    FOR ALL USING (auth.uid() = user_id);

-- 5. 创建索引
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- 6. 创建更新时间戳触发器
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at 
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. 验证表创建
SELECT 
    'user_preferences' as table_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'user_preferences'
        ) THEN '✅ 表已创建'
        ELSE '❌ 表创建失败'
    END as status;

-- 8. 验证RLS策略
SELECT 
    policyname,
    '✅ 策略已创建' as status
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'user_preferences';

-- 9. 验证索引
SELECT 
    indexname,
    '✅ 索引已创建' as status
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename = 'user_preferences';

-- 10. 验证触发器
SELECT 
    trigger_name,
    '✅ 触发器已创建' as status
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND event_object_table = 'user_preferences';

COMMIT;

-- 完成提示
SELECT '🎉 user_preferences表修复完成！请重启开发服务器测试。' as message;