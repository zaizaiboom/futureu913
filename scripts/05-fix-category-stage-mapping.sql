-- 修复category_id与stage_id的映射关系
-- 首先清理现有的映射关系，重新建立正确的分类体系

-- 1. 清理并重建问题分类表
DELETE FROM question_categories;

-- 重新插入正确的分类，确保与面试阶段的映射关系清晰
INSERT INTO question_categories (id, category_name, stage_id, description) VALUES
-- HR面试 (stage_id = 1)
(1, 'HR面：职业匹配度评估', 1, 'HR面作为面试流程的初始环节，旨在通过标准化问题评估候选人与AI产品经理岗位的基础匹配度'),
(2, '自我介绍与职业动机', 1, '评估候选人的自我认知、职业规划和岗位理解'),
(3, '职业规划与团队协作', 1, '考察实际项目经验和跨团队协作能力'),

-- 专业面试 (stage_id = 2) 
(4, '专业面：技术与产品实践', 2, '专业面聚焦AI产品经理的硬实力评估，涵盖技术理解、产品设计、商业平衡等核心维度'),
(5, 'AI产品设计思维', 2, '评估对AI技术的理解深度和产品化能力'),
(6, '技术与商业平衡', 2, '考察产品设计思维和用户体验优化能力'),

-- 终面 (stage_id = 3)
(7, '终面：战略思维与行业洞察', 3, '终面环节重点评估候选人的行业视野与战略思维'),
(8, '行业趋势判断', 3, '评估战略思维、行业洞察和商业判断力'),
(9, '复杂场景分析与商业模式', 3, '考察复杂业务场景的分析和解决能力');

-- 2. 更新现有题目的stage_id，确保与category_id正确映射
UPDATE interview_questions 
SET stage_id = CASE 
    WHEN category_id IN (1, 2, 3) THEN 1  -- HR面试
    WHEN category_id IN (4, 5, 6) THEN 2  -- 专业面试  
    WHEN category_id IN (7, 8, 9) THEN 3  -- 终面
    ELSE 1  -- 默认归到HR面试
END;

-- 3. 重置序列值
SELECT setval('question_categories_id_seq', (SELECT MAX(id) FROM question_categories));
