-- Create interview stages table
CREATE TABLE IF NOT EXISTS public.interview_stages (
    id SERIAL PRIMARY KEY,
    stage_name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create question categories table
CREATE TABLE IF NOT EXISTS public.question_categories (
    id SERIAL PRIMARY KEY,
    category_name TEXT NOT NULL,
    stage_id INTEGER REFERENCES public.interview_stages(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create interview questions table
CREATE TABLE IF NOT EXISTS public.interview_questions (
    id SERIAL PRIMARY KEY,
    question_text TEXT NOT NULL,
    standard_answer TEXT,
    answer_suggestion TEXT,
    category_id INTEGER REFERENCES public.question_categories(id),
    stage_id INTEGER REFERENCES public.interview_stages(id),
    source_reference TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create profiles table for user data
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    PRIMARY KEY (id)
);

-- Insert initial interview stages
INSERT INTO public.interview_stages (stage_name, description) VALUES
('HR面试', '综合评估标准化问题类型，重点询问你为什么想要这个职位，需要现场回答'),
('专业面试', '聚焦AI产品经理的硬实力问题，考察技术深度、商业洞察力和产品思维'),
('终面', '重点针对候选人的行业预判与战略思维，考察综合能力和未来潜力')
ON CONFLICT DO NOTHING;

-- Insert initial question categories
INSERT INTO public.question_categories (category_name, stage_id) VALUES
('基础问题', 1),
('动机与期望', 1),
('技术理解', 2),
('产品策略', 2),
('商业洞察', 2),
('战略思维', 3),
('行业预判', 3)
ON CONFLICT DO NOTHING;
