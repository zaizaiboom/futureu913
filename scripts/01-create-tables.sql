-- 创建用户资料表
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建面试阶段表
CREATE TABLE IF NOT EXISTS interview_stages (
  id SERIAL PRIMARY KEY,
  stage_name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建问题分类表
CREATE TABLE IF NOT EXISTS question_categories (
  id SERIAL PRIMARY KEY,
  category_name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建面试问题表
CREATE TABLE IF NOT EXISTS interview_questions (
  id SERIAL PRIMARY KEY,
  question_text TEXT NOT NULL,
  category_id INTEGER REFERENCES question_categories(id),
  stage_id INTEGER REFERENCES interview_stages(id),
  difficulty_level INTEGER CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
  expected_answer TEXT,
  keywords TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建面试记录表
CREATE TABLE IF NOT EXISTS interviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  stage_id INTEGER REFERENCES interview_stages(id),
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  score INTEGER,
  feedback TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建简历分析表
CREATE TABLE IF NOT EXISTS resume_analysis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  resume_content TEXT,
  analysis_result JSONB,
  recommendations TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建项目进度表
CREATE TABLE IF NOT EXISTS project_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  project_name TEXT NOT NULL,
  progress_percentage INTEGER CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  status TEXT CHECK (status IN ('not_started', 'in_progress', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建职位推荐表
CREATE TABLE IF NOT EXISTS job_recommendations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  job_title TEXT NOT NULL,
  company_name TEXT,
  match_score INTEGER CHECK (match_score >= 0 AND match_score <= 100),
  requirements TEXT[],
  recommended_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用行级安全策略
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_recommendations ENABLE ROW LEVEL SECURITY;

-- 创建安全策略
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own interviews" ON interviews FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own interviews" ON interviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own interviews" ON interviews FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own resume analysis" ON resume_analysis FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own resume analysis" ON resume_analysis FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own project progress" ON project_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own project progress" ON project_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own project progress" ON project_progress FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own job recommendations" ON job_recommendations FOR SELECT USING (auth.uid() = user_id);

-- 公共表的策略（所有认证用户可读）
CREATE POLICY "Authenticated users can view interview stages" ON interview_stages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view question categories" ON question_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view interview questions" ON interview_questions FOR SELECT TO authenticated USING (true);
