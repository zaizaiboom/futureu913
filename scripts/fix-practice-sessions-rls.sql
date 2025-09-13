-- 修复 practice_sessions 表的 RLS 策略
-- 解决 "relation public.practice_sessions does not exist" 错误

BEGIN;

-- 1. 确保 practice_sessions 表启用 RLS
ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;

-- 2. 删除可能存在的旧策略
DROP POLICY IF EXISTS "Users can view own practice sessions" ON public.practice_sessions;
DROP POLICY IF EXISTS "Users can insert own practice sessions" ON public.practice_sessions;
DROP POLICY IF EXISTS "Users can update own practice sessions" ON public.practice_sessions;
DROP POLICY IF EXISTS "Users can delete own practice sessions" ON public.practice_sessions;

-- 3. 创建新的 RLS 策略
-- 允许用户查看自己的练习记录
CREATE POLICY "Users can view own practice sessions" ON public.practice_sessions
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- 允许用户插入自己的练习记录
CREATE POLICY "Users can insert own practice sessions" ON public.practice_sessions
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 允许用户更新自己的练习记录
CREATE POLICY "Users can update own practice sessions" ON public.practice_sessions
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 允许用户删除自己的练习记录
CREATE POLICY "Users can delete own practice sessions" ON public.practice_sessions
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- 4. 同样为其他相关表添加 RLS 策略（如果还没有的话）

-- competency_assessments 表
ALTER TABLE public.competency_assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own competency assessments" ON public.competency_assessments;
CREATE POLICY "Users can manage own competency assessments" ON public.competency_assessments
FOR ALL 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ai_insights 表
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own ai insights" ON public.ai_insights;
CREATE POLICY "Users can manage own ai insights" ON public.ai_insights
FOR ALL 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- user_target_domains 表
ALTER TABLE public.user_target_domains ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own target domains" ON public.user_target_domains;
CREATE POLICY "Users can manage own target domains" ON public.user_target_domains
FOR ALL 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- user_skills 表
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own skills" ON public.user_skills;
CREATE POLICY "Users can manage own skills" ON public.user_skills
FOR ALL 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 5. 验证策略是否正确创建
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual 
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
-- 此脚本修复了 practice_sessions 及相关表的 RLS 策略问题
-- 现在用户应该能够正常访问自己的练习记录和统计数据