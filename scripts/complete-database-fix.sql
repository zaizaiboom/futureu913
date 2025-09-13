-- 完整的数据库修复脚本
-- 创建缺失的表并设置正确的 RLS 策略

BEGIN;

-- 1. 首先创建缺失的表（如果不存在）

-- 创建练习记录表
CREATE TABLE IF NOT EXISTS public.practice_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    question_id INTEGER REFERENCES public.interview_questions(id),
    stage_id INTEGER REFERENCES public.interview_stages(id),
    category_id INTEGER REFERENCES public.question_categories(id),
    user_answer TEXT,
    audio_url TEXT,
    overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
    content_score INTEGER CHECK (content_score >= 0 AND content_score <= 100),
    logic_score INTEGER CHECK (logic_score >= 0 AND logic_score <= 100),
    expression_score INTEGER CHECK (expression_score >= 0 AND expression_score <= 100),
    ai_feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 创建能力评估表（用于雷达图）
CREATE TABLE IF NOT EXISTS public.competency_assessments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.practice_sessions(id) ON DELETE CASCADE,
    logical_thinking INTEGER CHECK (logical_thinking >= 0 AND logical_thinking <= 100),
    user_empathy INTEGER CHECK (user_empathy >= 0 AND user_empathy <= 100),
    business_acumen INTEGER CHECK (business_acumen >= 0 AND business_acumen <= 100),
    communication_skills INTEGER CHECK (communication_skills >= 0 AND communication_skills <= 100),
    technical_understanding INTEGER CHECK (technical_understanding >= 0 AND technical_understanding <= 100),
    strategic_thinking INTEGER CHECK (strategic_thinking >= 0 AND strategic_thinking <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 创建AI洞察表
CREATE TABLE IF NOT EXISTS public.ai_insights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    insight_type TEXT NOT NULL, -- 'strength', 'weakness', 'recommendation'
    insight_content TEXT NOT NULL,
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

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

-- 2. 启用所有表的 RLS
ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competency_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_target_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;

-- 3. 删除可能存在的旧策略
DROP POLICY IF EXISTS "Users can view own practice sessions" ON public.practice_sessions;
DROP POLICY IF EXISTS "Users can insert own practice sessions" ON public.practice_sessions;
DROP POLICY IF EXISTS "Users can update own practice sessions" ON public.practice_sessions;
DROP POLICY IF EXISTS "Users can delete own practice sessions" ON public.practice_sessions;

DROP POLICY IF EXISTS "Users can manage own competency assessments" ON public.competency_assessments;
DROP POLICY IF EXISTS "Users can manage own ai insights" ON public.ai_insights;
DROP POLICY IF EXISTS "Users can manage own target domains" ON public.user_target_domains;
DROP POLICY IF EXISTS "Users can manage own skills" ON public.user_skills;

-- 4. 创建 practice_sessions 表的 RLS 策略
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

-- 5. 创建其他表的 RLS 策略
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

CREATE POLICY "Users can manage own target domains" ON public.user_target_domains
FOR ALL 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own skills" ON public.user_skills
FOR ALL 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 6. 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_practice_sessions_user_id ON public.practice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_created_at ON public.practice_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_competency_assessments_user_id ON public.competency_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_user_id ON public.ai_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_user_target_domains_user_id ON public.user_target_domains(user_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_user_id ON public.user_skills(user_id);

-- 7. 创建更新时间戳的触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. 为 practice_sessions 表添加更新时间戳触发器
DROP TRIGGER IF EXISTS update_practice_sessions_updated_at ON public.practice_sessions;
CREATE TRIGGER update_practice_sessions_updated_at
    BEFORE UPDATE ON public.practice_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 9. 验证表和策略是否正确创建
SELECT 
    'Tables created' as status,
    COUNT(*) as count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'practice_sessions', 
    'competency_assessments', 
    'ai_insights', 
    'user_target_domains', 
    'user_skills'
);

SELECT 
    'RLS Policies created' as status,
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd
FROM pg_policies 
WHERE tablename IN (
    'practice_sessions', 
    'competency_assessments', 
    'ai_insights', 
    'user_target_domains', 
    'user_skills'
)
ORDER BY tablename, policyname;

COMMIT;

-- 执行完成后的说明
-- 此脚本创建了所有缺失的表并设置了正确的 RLS 策略
-- 现在用户应该能够正常访问自己的练习记录和统计数据
-- 如果仍有问题，请检查 Supabase 项目的认证设置