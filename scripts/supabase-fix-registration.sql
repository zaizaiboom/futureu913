-- Supabase用户注册修复脚本
-- 请在Supabase管理面板的SQL编辑器中执行此脚本

-- 1. 删除现有的严格RLS策略
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- 2. 创建更宽松的RLS策略以支持用户注册
CREATE POLICY "Enable insert for authenticated users only" ON profiles
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for users based on user_id" ON profiles
FOR SELECT USING (auth.uid() = id OR auth.role() = 'service_role');

CREATE POLICY "Enable update for users based on user_id" ON profiles
FOR UPDATE USING (auth.uid() = id);

-- 3. 创建触发器函数来自动创建profile记录
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (new.id, new.email, now(), now());
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 删除现有触发器（如果存在）
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 5. 创建新的触发器
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 6. 为现有用户创建缺失的profile记录（如果有的话）
INSERT INTO public.profiles (id, email, created_at, updated_at)
SELECT 
  id, 
  email, 
  created_at, 
  COALESCE(updated_at, created_at)
FROM auth.users 
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- 验证修复
SELECT 
  'RLS策略数量' as 检查项目,
  COUNT(*) as 数量
FROM pg_policies 
WHERE tablename = 'profiles';

SELECT 
  'Profiles表记录数' as 检查项目,
  COUNT(*) as 数量  
FROM public.profiles;

SELECT 
  'Auth用户数' as 检查项目,
  COUNT(*) as 数量
FROM auth.users;
