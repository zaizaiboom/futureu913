-- 检查学习报告页面所需的数据库表
-- 诊断学习报告404错误的原因

-- ========================================
-- 1. 检查所有必需的表是否存在
-- ========================================

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
        ('question_categories'),
        ('profiles')
) AS required_tables(required_table)
ORDER BY required_table;

-- ========================================
-- 2. 检查practice_sessions表结构（如果存在）
-- ========================================

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'practice_sessions'
ORDER BY ordinal_position;

-- ========================================
-- 3. 检查关联表的外键关系
-- ========================================

SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name IN ('practice_sessions', 'interview_questions', 'interview_stages', 'question_categories')
ORDER BY tc.table_name, kcu.column_name;

-- ========================================
-- 4. 检查RLS策略
-- ========================================

SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('practice_sessions', 'interview_questions', 'interview_stages', 'question_categories')
ORDER BY tablename, policyname;

-- ========================================
-- 5. 检查表中是否有数据
-- ========================================

-- 检查interview_stages表数据
SELECT 'interview_stages' as table_name, COUNT(*) as record_count
FROM interview_stages
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'interview_stages')
UNION ALL

-- 检查question_categories表数据
SELECT 'question_categories' as table_name, COUNT(*) as record_count
FROM question_categories
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'question_categories')
UNION ALL

-- 检查interview_questions表数据
SELECT 'interview_questions' as table_name, COUNT(*) as record_count
FROM interview_questions
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'interview_questions')
UNION ALL

-- 检查practice_sessions表数据
SELECT 'practice_sessions' as table_name, COUNT(*) as record_count
FROM practice_sessions
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'practice_sessions');

-- ========================================
-- 6. 测试学习报告查询
-- ========================================

-- 模拟学习报告页面的查询（如果表存在）
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'practice_sessions') THEN
        RAISE NOTICE '测试学习报告查询...';
        
        -- 测试基本查询
        PERFORM COUNT(*) FROM practice_sessions;
        RAISE NOTICE '✅ practice_sessions基本查询成功';
        
        -- 测试关联查询
        PERFORM COUNT(*) FROM practice_sessions ps
        LEFT JOIN interview_questions iq ON ps.question_id = iq.id
        LEFT JOIN interview_stages ist ON ps.stage_id = ist.id
        LEFT JOIN question_categories qc ON ps.category_id = qc.id;
        RAISE NOTICE '✅ practice_sessions关联查询成功';
        
    ELSE
        RAISE NOTICE '❌ practice_sessions表不存在，无法执行查询测试';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ 查询测试失败: %', SQLERRM;
END $$;

-- 完成提示
SELECT '🔍 学习报告表检查完成！请查看上述结果以诊断问题。' as message;