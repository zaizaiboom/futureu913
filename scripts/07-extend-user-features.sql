-- 扩展用户资料表，支持个人资料页面功能
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS membership_status TEXT DEFAULT 'free';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_stage TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS years_of_experience TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS portfolio_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS resume_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW());

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
    data_driven INTEGER CHECK (data_driven >= 0 AND data_driven <= 100),
    communication INTEGER CHECK (communication >= 0 AND communication <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 创建AI智能建议表
CREATE TABLE IF NOT EXISTS public.ai_insights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    insight_type TEXT NOT NULL, -- 'strength', 'weakness', 'recommendation'
    content TEXT NOT NULL,
    recommended_questions TEXT[], -- 推荐题目ID数组
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- 创建用户设置表
CREATE TABLE IF NOT EXISTS public.user_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    notification_enabled BOOLEAN DEFAULT true,
    email_reminders BOOLEAN DEFAULT true,
    practice_reminder_frequency TEXT DEFAULT 'weekly', -- 'daily', 'weekly', 'monthly', 'never'
    preferred_difficulty TEXT DEFAULT 'medium', -- 'easy', 'medium', 'hard'
    auto_save_answers BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 插入预定义的目标领域选项
INSERT INTO public.user_target_domains (user_id, domain_name) 
SELECT NULL, unnest(ARRAY['SaaS', 'AIGC', '大语言模型', '金融科技', '自动驾驶', '智能硬件', '教育科技', '医疗AI', '电商推荐', '内容平台'])
ON CONFLICT DO NOTHING;

-- 插入预定义的技能标签选项
INSERT INTO public.user_skills (user_id, skill_name)
SELECT NULL, unnest(ARRAY['用户研究', '数据分析', 'PRD撰写', '项目管理', '市场分析', '竞品分析', 'A/B测试', '用户体验设计', '商业建模', '技术理解', '团队协作', '沟通表达'])
ON CONFLICT DO NOTHING;

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_practice_sessions_user_id ON public.practice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_created_at ON public.practice_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_competency_assessments_user_id ON public.competency_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_user_id ON public.ai_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_user_target_domains_user_id ON public.user_target_domains(user_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_user_id ON public.user_skills(user_id);

-- 创建更新时间戳的触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为相关表添加更新时间戳触发器
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_practice_sessions_updated_at BEFORE UPDATE ON public.practice_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON public.user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();