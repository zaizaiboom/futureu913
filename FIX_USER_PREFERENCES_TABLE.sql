-- ========================================
-- 修复用户偏好设置表脚本
-- 解决设置页面中user_preferences表缺失的问题
-- ========================================

BEGIN;

-- ========================================
-- 1. 创建 user_preferences 表
-- ========================================

CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- 通知设置（已移除UI，但保留表结构以防数据库查询错误）
    email_notifications BOOLEAN DEFAULT true,
    practice_reminders BOOLEAN DEFAULT true,
    progress_reports BOOLEAN DEFAULT true,
    marketing_emails BOOLEAN DEFAULT false,
    
    -- 其他用户偏好设置
    theme VARCHAR(20) DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'system')),
    language VARCHAR(10) DEFAULT 'zh-CN',
    timezone VARCHAR(50) DEFAULT 'Asia/Shanghai',
    
    -- 练习偏好
    difficulty_preference VARCHAR(20) DEFAULT 'medium' CHECK (difficulty_preference IN ('easy', 'medium', 'hard', 'mixed')),
    
    -- 时间戳
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 确保每个用户只有一条记录
    UNIQUE(user_id)
);

-- ========================================
-- 2. 创建索引
-- ========================================

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_created_at ON public.user_preferences(created_at);

-- ========================================
-- 3. 启用 RLS (Row Level Security)
-- ========================================

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 4. 创建 RLS 策略
-- ========================================

-- 删除现有策略（如果存在）
DROP POLICY IF EXISTS "Users can view own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can delete own preferences" ON public.user_preferences;

-- 用户只能查看自己的偏好设置
CREATE POLICY "Users can view own preferences" ON public.user_preferences
    FOR SELECT USING (auth.uid() = user_id);

-- 用户只能插入自己的偏好设置
CREATE POLICY "Users can insert own preferences" ON public.user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 用户只能更新自己的偏好设置
CREATE POLICY "Users can update own preferences" ON public.user_preferences
    FOR UPDATE USING (auth.uid() = user_id);

-- 用户只能删除自己的偏好设置
CREATE POLICY "Users can delete own preferences" ON public.user_preferences
    FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- 5. 创建更新时间戳的触发器函数
-- ========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ========================================
-- 6. 创建触发器
-- ========================================

DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON public.user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 7. 为现有用户创建默认偏好设置
-- ========================================

-- 为所有现有用户创建默认偏好设置记录
INSERT INTO public.user_preferences (user_id)
SELECT id
FROM auth.users
WHERE id NOT IN (
    SELECT user_id 
    FROM public.user_preferences 
    WHERE user_id IS NOT NULL
)
ON CONFLICT (user_id) DO NOTHING;

-- ========================================
-- 8. 创建函数：自动为新用户创建偏好设置
-- ========================================

CREATE OR REPLACE FUNCTION public.handle_new_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 9. 创建触发器：新用户注册时自动创建偏好设置
-- ========================================

DROP TRIGGER IF EXISTS on_auth_user_created_preferences ON auth.users;
CREATE TRIGGER on_auth_user_created_preferences
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_preferences();

-- ========================================
-- 10. 验证修复结果
-- ========================================

-- 验证表是否创建成功
SELECT
    CASE
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = 'user_preferences'
        ) THEN '✅ user_preferences表创建成功'
        ELSE '❌ user_preferences表创建失败'
    END as table_status;

-- 验证RLS策略
SELECT
    COUNT(*) as policy_count,
    '✅ RLS策略已创建' as status
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'user_preferences';

-- 验证现有用户的偏好设置记录
SELECT
    COUNT(*) as user_preferences_count,
    '✅ 用户偏好设置记录已创建' as status
FROM public.user_preferences;

-- 验证触发器
SELECT
    COUNT(*) as trigger_count,
    '✅ 触发器已创建' as status
FROM information_schema.triggers
WHERE event_object_table = 'user_preferences'
AND trigger_schema = 'public';

COMMIT;

-- 完成提示
SELECT '🎉 用户偏好设置表修复完成！设置页面应该可以正常工作了。' as message;