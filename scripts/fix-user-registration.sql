-- 修复用户注册问题的RLS策略
-- 问题：profiles表的RLS策略阻止了新用户注册时创建profile记录

BEGIN;

-- 方案1：简化profiles表的RLS策略，允许用户注册
-- 删除现有的profiles表策略
DROP POLICY IF EXISTS "Users can manage their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- 创建更宽松的策略，允许认证用户管理自己的profile
CREATE POLICY "Users can manage their own profile" ON public.profiles 
FOR ALL 
TO authenticated
USING (auth.uid() = id) 
WITH CHECK (auth.uid() = id);

-- 方案2：如果方案1不行，可以暂时禁用profiles表的RLS
-- 取消注释下面这行来禁用profiles表的RLS
-- ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

COMMIT;
