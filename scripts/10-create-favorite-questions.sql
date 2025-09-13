-- 创建 favorite_questions 表
CREATE TABLE IF NOT EXISTS favorite_questions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES interview_questions(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now()
);

-- 启用 RLS
ALTER TABLE favorite_questions ENABLE ROW LEVEL SECURITY;

-- 创建策略
CREATE POLICY "Users can manage their own favorites" ON favorite_questions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 创建唯一索引以防止重复收藏
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_question_favorite ON favorite_questions (user_id, question_id);