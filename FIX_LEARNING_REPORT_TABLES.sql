-- 🔧 修复学习报告页面所需的数据库表
-- 创建缺失的practice_sessions和相关表

BEGIN;

-- ========================================
-- 1. 创建interview_stages表（如果不存在）
-- ========================================

CREATE TABLE IF NOT EXISTS interview_stages (
    id SERIAL PRIMARY KEY,
    stage_name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 插入基础面试阶段数据
INSERT INTO interview_stages (stage_name, description) VALUES
    ('行为面试', '评估候选人的行为表现和软技能'),
    ('技术面试', '评估候选人的技术能力和专业知识'),
    ('案例分析', '评估候选人的分析和解决问题能力'),
    ('产品设计', '评估候选人的产品设计和创新能力'),
    ('战略思维', '评估候选人的战略规划和商业思维')
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- 2. 创建question_categories表（如果不存在）
-- ========================================

CREATE TABLE IF NOT EXISTS question_categories (
    id SERIAL PRIMARY KEY,
    category_name TEXT NOT NULL,
    description TEXT,
    stage_id INTEGER REFERENCES interview_stages(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 插入基础问题分类数据
INSERT INTO question_categories (category_name, description, stage_id) VALUES
    ('沟通协作', '团队合作和沟通能力相关问题', 1),
    ('领导力', '领导和管理能力相关问题', 1),
    ('产品思维', '产品设计和用户体验相关问题', 2),
    ('数据分析', '数据驱动决策相关问题', 2),
    ('市场分析', '市场研究和竞品分析相关问题', 3),
    ('用户研究', '用户需求和行为分析相关问题', 3),
    ('产品规划', '产品策略和路线图相关问题', 4),
    ('创新思维', '创新和创意思维相关问题', 4),
    ('商业模式', '商业策略和盈利模式相关问题', 5),
    ('行业洞察', '行业趋势和市场机会相关问题', 5)
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- 3. 创建interview_questions表（如果不存在）
-- ========================================

CREATE TABLE IF NOT EXISTS interview_questions (
    id SERIAL PRIMARY KEY,
    question_text TEXT NOT NULL,
    category_id INTEGER REFERENCES question_categories(id),
    stage_id INTEGER REFERENCES interview_stages(id),
    difficulty_level INTEGER CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
    expected_answer TEXT,
    answer_suggestion TEXT,
    keywords TEXT[],
    time_limit INTEGER DEFAULT 300,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 插入一些示例问题
INSERT INTO interview_questions (question_text, category_id, stage_id, difficulty_level, expected_answer, answer_suggestion, keywords) VALUES
    ('请描述一次你在团队中解决冲突的经历。', 1, 1, 2, '应包含具体情况、采取的行动和最终结果', '使用STAR方法回答：情况、任务、行动、结果', ARRAY['团队合作', '冲突解决', '沟通']),
    ('如何设计一个新的社交媒体产品？', 3, 2, 3, '应包含用户研究、功能设计、技术架构等方面', '从用户需求出发，考虑市场定位、核心功能、技术实现', ARRAY['产品设计', '用户体验', '社交媒体']),
    ('分析一下某个你熟悉的产品的商业模式。', 9, 5, 4, '应包含价值主张、收入模式、成本结构等', '选择知名产品，分析其如何创造和获取价值', ARRAY['商业模式', '价值主张', '盈利模式'])
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- 4. 创建practice_sessions表（如果不存在）
-- ========================================

CREATE TABLE IF NOT EXISTS practice_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    question_id INTEGER REFERENCES interview_questions(id),
    stage_id INTEGER REFERENCES interview_stages(id),
    category_id INTEGER REFERENCES question_categories(id),
    user_answer TEXT,
    audio_url TEXT,
    overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
    content_score INTEGER CHECK (content_score >= 0 AND content_score <= 100),
    logic_score INTEGER CHECK (logic_score >= 0 AND logic_score <= 100),
    expression_score INTEGER CHECK (expression_score >= 0 AND expression_score <= 100),
    ai_feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 5. 启用RLS并创建策略
-- ========================================

-- 为practice_sessions启用RLS
ALTER TABLE practice_sessions ENABLE ROW LEVEL SECURITY;

-- 删除可能存在的旧策略
DROP POLICY IF EXISTS "Users can manage own practice sessions" ON practice_sessions;
DROP POLICY IF EXISTS "Users can view own practice sessions" ON practice_sessions;
DROP POLICY IF EXISTS "Users can insert own practice sessions" ON practice_sessions;
DROP POLICY IF EXISTS "Users can update own practice sessions" ON practice_sessions;
DROP POLICY IF EXISTS "Users can delete own practice sessions" ON practice_sessions;

-- 创建RLS策略
CREATE POLICY "Users can manage own practice sessions" ON practice_sessions
    FOR ALL USING (auth.uid() = user_id);

-- 为公共表创建读取策略
ALTER TABLE interview_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view interview stages" ON interview_stages;
DROP POLICY IF EXISTS "Authenticated users can view question categories" ON question_categories;
DROP POLICY IF EXISTS "Authenticated users can view interview questions" ON interview_questions;

CREATE POLICY "Authenticated users can view interview stages" ON interview_stages
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can view question categories" ON question_categories
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can view interview questions" ON interview_questions
    FOR SELECT TO authenticated USING (true);

-- ========================================
-- 6. 创建索引
-- ========================================

CREATE INDEX IF NOT EXISTS idx_practice_sessions_user_id ON practice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_created_at ON practice_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_question_id ON practice_sessions(question_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_stage_id ON practice_sessions(stage_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_category_id ON practice_sessions(category_id);

CREATE INDEX IF NOT EXISTS idx_interview_questions_category_id ON interview_questions(category_id);
CREATE INDEX IF NOT EXISTS idx_interview_questions_stage_id ON interview_questions(stage_id);
CREATE INDEX IF NOT EXISTS idx_question_categories_stage_id ON question_categories(stage_id);

-- ========================================
-- 7. 创建更新时间戳触发器
-- ========================================

-- 确保update_updated_at_column函数存在
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 创建触发器
DROP TRIGGER IF EXISTS update_practice_sessions_updated_at ON practice_sessions;
CREATE TRIGGER update_practice_sessions_updated_at 
    BEFORE UPDATE ON practice_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_interview_questions_updated_at ON interview_questions;
CREATE TRIGGER update_interview_questions_updated_at 
    BEFORE UPDATE ON interview_questions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 8. 验证修复结果
-- ========================================

-- 验证所有表都存在
SELECT 
    required_table,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = required_table
        ) THEN '✅ 存在'
        ELSE '❌ 缺失'
    END as status
FROM (
    VALUES 
        ('practice_sessions'),
        ('interview_questions'),
        ('interview_stages'),
        ('question_categories')
) AS required_tables(required_table)
ORDER BY required_table;

-- 验证RLS策略
SELECT 
    tablename,
    policyname,
    '✅ 策略已创建' as status
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('practice_sessions', 'interview_questions', 'interview_stages', 'question_categories')
ORDER BY tablename, policyname;

-- 验证数据是否插入成功
SELECT 
    'interview_stages' as table_name,
    COUNT(*) as record_count
FROM interview_stages
UNION ALL
SELECT 
    'question_categories' as table_name,
    COUNT(*) as record_count
FROM question_categories
UNION ALL
SELECT 
    'interview_questions' as table_name,
    COUNT(*) as record_count
FROM interview_questions;

COMMIT;

-- 完成提示
SELECT '🎉 学习报告表修复完成！请重启开发服务器。' as message;