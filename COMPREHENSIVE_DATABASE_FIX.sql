-- 🚨 综合数据库修复脚本
-- 解决Cookie JSON解析错误、profiles表字段缺失和RLS策略问题
-- 基于用户反馈的错误日志进行系统性修复

BEGIN;

-- ========================================
-- 1. 检查并修复profiles表结构
-- ========================================

-- 检查profiles表当前结构
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 添加缺失的字段（如果不存在）
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS membership_status TEXT DEFAULT 'free';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_stage TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS years_of_experience TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS portfolio_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS resume_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW());

-- 修复email字段约束问题（允许为空）
ALTER TABLE public.profiles ALTER COLUMN email DROP NOT NULL;

-- ========================================
-- 2. 确保所有必需的表存在
-- ========================================

-- 创建用户目标领域表
CREATE TABLE IF NOT EXISTS public.user_target_domains (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    domain_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 创建用户技能标签表
CREATE TABLE IF NOT EXISTS public.user_skills (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    skill_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 创建练习记录表
CREATE TABLE IF NOT EXISTS public.practice_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    question_id INTEGER REFERENCES public.interview_questions(id),
    stage_id INTEGER REFERENCES public.interview_stages(id),
    category_id INTEGER REFERENCES public.question_categories(id),
    user_answer TEXT,
    ai_feedback TEXT,
    score INTEGER CHECK (score >= 0 AND score <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 创建能力评估表
CREATE TABLE IF NOT EXISTS public.competency_assessments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    assessment_data JSONB,
    overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
    strengths TEXT[],
    improvement_areas TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 创建AI洞察表
CREATE TABLE IF NOT EXISTS public.ai_insights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    insight_type TEXT NOT NULL,
    insight_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 创建用户偏好设置表
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    theme VARCHAR(20) DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'system')),
    language VARCHAR(10) DEFAULT 'zh-CN',
    timezone VARCHAR(50) DEFAULT 'Asia/Shanghai',
    difficulty_preference VARCHAR(20) DEFAULT 'medium' CHECK (difficulty_preference IN ('easy', 'medium', 'hard', 'mixed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- ========================================
-- 3. 启用所有表的RLS
-- ========================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_target_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competency_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 4. 删除可能存在的旧策略
-- ========================================

-- profiles表策略
DROP POLICY IF EXISTS "Users can manage their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- user_target_domains表策略
DROP POLICY IF EXISTS "Users can manage own target domains" ON public.user_target_domains;
DROP POLICY IF EXISTS "Users can view own target domains" ON public.user_target_domains;
DROP POLICY IF EXISTS "Users can insert own target domains" ON public.user_target_domains;
DROP POLICY IF EXISTS "Users can update own target domains" ON public.user_target_domains;
DROP POLICY IF EXISTS "Users can delete own target domains" ON public.user_target_domains;

-- user_skills表策略
DROP POLICY IF EXISTS "Users can manage own skills" ON public.user_skills;
DROP POLICY IF EXISTS "Users can view own skills" ON public.user_skills;
DROP POLICY IF EXISTS "Users can insert own skills" ON public.user_skills;
DROP POLICY IF EXISTS "Users can update own skills" ON public.user_skills;
DROP POLICY IF EXISTS "Users can delete own skills" ON public.user_skills;

-- practice_sessions表策略
DROP POLICY IF EXISTS "Users can manage own practice sessions" ON public.practice_sessions;
DROP POLICY IF EXISTS "Users can view own practice sessions" ON public.practice_sessions;
DROP POLICY IF EXISTS "Users can insert own practice sessions" ON public.practice_sessions;
DROP POLICY IF EXISTS "Users can update own practice sessions" ON public.practice_sessions;
DROP POLICY IF EXISTS "Users can delete own practice sessions" ON public.practice_sessions;

-- 其他表策略
DROP POLICY IF EXISTS "Users can manage own competency assessments" ON public.competency_assessments;
DROP POLICY IF EXISTS "Users can manage own ai insights" ON public.ai_insights;
DROP POLICY IF EXISTS "Users can manage own preferences" ON public.user_preferences;

-- ========================================
-- 5. 创建新的RLS策略（更宽松但安全）
-- ========================================

-- profiles表策略 - 允许用户管理自己的资料
CREATE POLICY "Users can manage their own profile" ON public.profiles
FOR ALL 
TO authenticated
USING (auth.uid() = id) 
WITH CHECK (auth.uid() = id);

-- user_target_domains表策略
CREATE POLICY "Users can view own target domains" ON public.user_target_domains
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own target domains" ON public.user_target_domains
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own target domains" ON public.user_target_domains
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own target domains" ON public.user_target_domains
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- user_skills表策略
CREATE POLICY "Users can view own skills" ON public.user_skills
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own skills" ON public.user_skills
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own skills" ON public.user_skills
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own skills" ON public.user_skills
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- practice_sessions表策略
CREATE POLICY "Users can view own practice sessions" ON public.practice_sessions
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own practice sessions" ON public.practice_sessions
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own practice sessions" ON public.practice_sessions
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own practice sessions" ON public.practice_sessions
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- 其他表的策略
CREATE POLICY "Users can manage own competency assessments" ON public.competency_assessments
FOR ALL 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own ai insights" ON public.ai_insights
FOR ALL 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own preferences" ON public.user_preferences
FOR ALL 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ========================================
-- 6. 创建索引以提高查询性能
-- ========================================

CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);
CREATE INDEX IF NOT EXISTS idx_user_target_domains_user_id ON public.user_target_domains(user_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_user_id ON public.user_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_user_id ON public.practice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_created_at ON public.practice_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_competency_assessments_user_id ON public.competency_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_user_id ON public.ai_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);

-- ========================================
-- 7. 创建更新时间戳的触发器函数
-- ========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为相关表添加更新时间戳触发器
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON public.user_preferences;
CREATE TRIGGER update_user_preferences_updated_at 
    BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 8. 验证修复结果
-- ========================================

-- 检查所有表是否存在
SELECT 
    table_name,
    CASE 
        WHEN table_name IN (
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        ) THEN '✅ 存在'
        ELSE '❌ 缺失'
    END as status
FROM (
    VALUES 
        ('profiles'),
        ('user_target_domains'),
        ('user_skills'),
        ('practice_sessions'),
        ('competency_assessments'),
        ('ai_insights'),
        ('user_preferences')
) AS required_tables(table_name)
ORDER BY table_name;

-- 检查RLS策略
SELECT 
    schemaname,
    tablename, 
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN (
    'profiles',
    'user_target_domains',
    'user_skills',
    'practice_sessions',
    'competency_assessments',
    'ai_insights',
    'user_preferences'
)
ORDER BY tablename, policyname;

COMMIT;

-- ========================================
-- 执行完成提示
-- ========================================

SELECT '🎉 数据库修复完成！' as message,
       '请清除浏览器Cookie并重新登录测试' as next_step;

-- ========================================
-- 使用说明
-- ========================================

/*
修复完成后的操作步骤：

1. 清除浏览器Cookie：
   - 打开浏览器开发者工具 (F12)
   - 进入 Application -> Cookies
   - 删除所有以 sb- 开头的Cookie
   - 刷新页面

2. 重新登录：
   - 使用现有账户重新登录
   - 测试个人资料页面的所有功能

3. 验证功能：
   - 保存个人资料
   - 添加/删除目标领域
   - 添加/删除技能标签
   - 检查是否还有错误

如果仍有问题，请检查：
- Supabase项目的环境变量配置
- 网络连接是否正常
- 是否在正确的Supabase项目中执行了脚本
*/