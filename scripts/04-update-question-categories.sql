-- 更新问题分类表，确保与新题目匹配
INSERT INTO question_categories (id, category_name, stage_id, description) VALUES
(1, 'HR面：职业匹配度评估', 1, 'HR面作为面试流程的初始环节，旨在通过标准化问题评估候选人与AI产品经理岗位的基础匹配度'),
(2, '专业面：技术与产品实践', 2, '专业面聚焦AI产品经理的硬实力评估，涵盖技术理解、产品设计、商业平衡等核心维度'),
(3, '终面：战略思维与行业洞察', 3, '终面环节重点评估候选人的行业视野与战略思维，需结合2025年AI产业趋势与复杂场景分析能力')
ON CONFLICT (id) DO UPDATE SET
  category_name = EXCLUDED.category_name,
  description = EXCLUDED.description;
