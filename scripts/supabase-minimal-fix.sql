-- Supabase最小化修复脚本
-- 如果其他脚本执行失败，请尝试这个最简化版本

-- 只创建触发器函数和触发器，不修改现有策略

-- 创建或替换触发器函数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- 尝试插入新的profile记录，如果已存在则忽略
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (new.id, new.email, now(), now())
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 删除现有触发器（如果存在）
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 创建新触发器
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 为现有用户补充profile记录
INSERT INTO public.profiles (id, email, created_at, updated_at)
SELECT 
  u.id, 
  u.email, 
  u.created_at, 
  COALESCE(u.updated_at, u.created_at)
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 验证结果
SELECT '触发器创建完成，现在新用户注册时会自动创建profile记录' as 状态;
