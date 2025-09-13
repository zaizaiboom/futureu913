-- Supabase用户注册修复脚本（分步执行版本）
-- 请按顺序逐步执行以下SQL语句
-- 如果某个步骤出错，可以跳过继续执行下一步

-- ========== 步骤1：清理现有策略 ==========
-- 执行以下语句来删除可能冲突的策略
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable read access for users based on user_id" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON profiles;

-- ========== 步骤2：创建插入策略 ==========
CREATE POLICY "Enable insert for authenticated users only" ON profiles
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ========== 步骤3：创建读取策略 ==========
CREATE POLICY "Enable read access for users based on user_id" ON profiles
FOR SELECT USING (auth.uid() = id OR auth.role() = 'service_role');

-- ========== 步骤4：创建更新策略 ==========
CREATE POLICY "Enable update for users based on user_id" ON profiles
FOR UPDATE USING (auth.uid() = id);

-- ========== 步骤5：创建触发器函数 ==========
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (new.id, new.email, now(), now())
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========== 步骤6：删除现有触发器 ==========
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- ========== 步骤7：创建新触发器 ==========
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ========== 步骤8：为现有用户创建profile记录 ==========
INSERT INTO public.profiles (id, email, created_at, updated_at)
SELECT 
  id, 
  email, 
  created_at, 
  COALESCE(updated_at, created_at)
FROM auth.users 
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- ========== 验证步骤 ==========
-- 检查策略数量
SELECT 
  'RLS策略数量' as 检查项目,
  COUNT(*) as 数量
FROM pg_policies 
WHERE tablename = 'profiles';

-- 检查profile记录数
SELECT 
  'Profiles表记录数' as 检查项目,
  COUNT(*) as 数量  
FROM public.profiles;

-- 检查用户数
SELECT 
  'Auth用户数' as 检查项目,
  COUNT(*) as 数量
FROM auth.users;
