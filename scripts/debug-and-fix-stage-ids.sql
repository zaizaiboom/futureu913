-- 调试和修复 stage_id 问题

-- 首先查看当前数据状态
SELECT 'Current question distribution:' as info;
SELECT stage_id, category_id, COUNT(*) as count 
FROM interview_questions 
GROUP BY stage_id, category_id 
ORDER BY stage_id, category_id;

-- 查看所有题目的 stage_id 状态
SELECT 'All questions stage_id status:' as info;
SELECT id, category_id, stage_id, LEFT(question_text, 50) as question_preview
FROM interview_questions 
ORDER BY id;

-- 修复 stage_id 基于 category_id 的映射
-- HR面试: category_id 1-2 -> stage_id 1
-- 专业面试: category_id 3-4 -> stage_id 2  
-- 终面: category_id 5-6 -> stage_id 3

UPDATE interview_questions 
SET stage_id = CASE 
    WHEN category_id IN (1, 2) THEN 1  -- HR面试
    WHEN category_id IN (3, 4) THEN 2  -- 专业面试
    WHEN category_id IN (5, 6) THEN 3  -- 终面
    ELSE stage_id  -- 保持原值
END;

-- 验证修复结果
SELECT 'After fix - question distribution:' as info;
SELECT stage_id, category_id, COUNT(*) as count 
FROM interview_questions 
GROUP BY stage_id, category_id 
ORDER BY stage_id, category_id;

-- 显示每个阶段的题目总数
SELECT 'Questions per stage:' as info;
SELECT 
    s.stage_name,
    s.id as stage_id,
    COUNT(q.id) as question_count
FROM interview_stages s
LEFT JOIN interview_questions q ON s.id = q.stage_id
GROUP BY s.id, s.stage_name
ORDER BY s.id;
