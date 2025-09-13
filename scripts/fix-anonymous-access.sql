-- 修复匿名用户访问题库的RLS策略
-- 允许匿名用户访问面试相关的公共数据表

-- 删除现有的认证用户策略
DROP POLICY IF EXISTS "Authenticated users can view public tables" ON public.interview_stages;
DROP POLICY IF EXISTS "Authenticated users can view public tables" ON public.question_categories;
DROP POLICY IF EXISTS "Authenticated users can view public tables" ON public.interview_questions;

-- 创建新的策略，允许所有用户（包括匿名用户）访问
CREATE POLICY "Allow public read access" ON public.interview_stages FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.question_categories FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.interview_questions FOR SELECT USING (true);

-- 验证策略是否生效
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('interview_stages', 'question_categories', 'interview_questions');
