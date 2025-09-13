-- 为practice_sessions表添加学习报告相关字段
-- 支持保存AI评估结果和学习报告

BEGIN;

-- 添加学习报告相关字段
ALTER TABLE practice_sessions 
ADD COLUMN IF NOT EXISTS learning_report JSONB,
ADD COLUMN IF NOT EXISTS session_id UUID DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS session_summary TEXT;

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_practice_sessions_session_id ON practice_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_user_session ON practice_sessions(user_id, session_id);

-- 更新现有记录，为没有session_id的记录生成新的session_id
UPDATE practice_sessions 
SET session_id = gen_random_uuid() 
WHERE session_id IS NULL;

-- 添加注释
COMMENT ON COLUMN practice_sessions.learning_report IS '存储AI生成的学习报告，包含优势、改进建议、核心提升点等';
COMMENT ON COLUMN practice_sessions.session_id IS '练习会话ID，用于将同一次练习的多个问题分组';
COMMENT ON COLUMN practice_sessions.session_summary IS '练习会话总结';

COMMIT;

-- 验证修改结果
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'practice_sessions' 
AND table_schema = 'public'
ORDER BY ordinal_position;