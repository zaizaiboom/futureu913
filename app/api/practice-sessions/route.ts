import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json()
    const { stage_type, questions_and_answers, evaluation_score, ai_feedback, learning_report } = requestBody

    console.log('📝 [API] 保存练习记录请求:', {
      stage_type,
      questionCount: questions_and_answers?.length,
      evaluation_score,
      hasLearningReport: !!learning_report,
      fullRequestBody: requestBody
    })

    // 验证必需的字段
    if (!stage_type) {
      console.error('❌ [API] 缺少 stage_type 字段')
      return NextResponse.json(
        { error: '缺少必需的字段: stage_type' },
        { status: 400 }
      )
    }

    if (!questions_and_answers || !Array.isArray(questions_and_answers)) {
      console.error('❌ [API] questions_and_answers 字段无效或缺失')
      return NextResponse.json(
        { error: '缺少必需的字段: questions_and_answers，或格式不正确' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    // 获取当前会话和用户
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session?.user) {
      console.error('❌ [API] 用户认证失败:', sessionError)
      return NextResponse.json(
        { error: '用户认证失败' },
        { status: 401 }
      )
    }
    
    const user = session.user

    // 直接使用阶段ID映射，避免数据库查询问题
    const stageIdMapping: Record<string, number> = {
      'hr': 1,
      'professional': 2,
      'final': 3
    }
    
    const stage_id = stageIdMapping[stage_type]
    
    if (!stage_id) {
      console.error('❌ [API] 无效的阶段类型:', stage_type)
      return NextResponse.json(
        { error: '无效的阶段类型' },
        { status: 400 }
      )
    }

    // 生成会话ID，将同一次练习的所有问题分组
    const sessionId = crypto.randomUUID()
    
    // 为每个问题计算分数并创建练习记录
    const practiceRecords = questions_and_answers.map((qa: any, index: number) => {
      const scores = calculateScores(ai_feedback, index, questions_and_answers.length)
      
      return {
        user_id: user.id,
        question_id: qa.question_id || null,
        stage_id: stage_id,
        category_id: null, // 暂时设为null
        user_answer: qa.answer,
        overall_score: scores.overall,
        content_score: scores.content,
        logic_score: scores.logic,
        expression_score: scores.expression,
        ai_feedback: JSON.stringify(ai_feedback), // 保存完整的AI反馈
        learning_report: learning_report ? JSON.stringify(learning_report) : null, // 保存学习报告
        session_id: sessionId, // 会话ID
        session_summary: learning_report?.summary || `${stage_type}阶段面试练习` // 会话总结
      }
    })

    // 批量插入练习记录
    const { data: insertedData, error: insertError } = await supabase
      .from('practice_sessions')
      .insert(practiceRecords)
      .select()
    
    if (insertError) {
      console.error('❌ [API] 插入练习记录失败:', insertError)
      return NextResponse.json(
        { error: '保存练习记录失败', details: insertError.message },
        { status: 500 }
      )
    }

    console.log('✅ [API] 练习记录保存成功:', {
      userId: user.id,
      recordCount: insertedData?.length,
      stageId: stage_id
    })

    return NextResponse.json({
      success: true,
      message: '练习记录保存成功',
      recordCount: insertedData?.length
    })
    
  } catch (error) {
    console.error('💥 [API] 保存练习记录错误:', error)
    return NextResponse.json(
      {
        error: '保存练习记录失败',
        message: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}

// 根据评估结果计算各项分数
function calculateScores(evaluationResult: any, questionIndex: number, totalQuestions: number) {
  if (!evaluationResult) {
    return {
      overall: 60,
      content: 60,
      logic: 60,
      expression: 60
    }
  }

  // 根据表现等级设置基础分数
  const performanceScores: Record<string, number> = {
    '导演级表现': 90,
    '制片级表现': 80,
    '编剧级表现': 70,
    '助理级表现': 60
  }
  
  const baseScore = performanceScores[evaluationResult.performanceLevel] || 60
  
  // 添加一些随机变化使每题分数略有不同
  const variation = Math.floor(Math.random() * 10) - 5 // -5到+5的变化
  
  const overall = Math.max(0, Math.min(100, baseScore + variation))
  const content = Math.max(0, Math.min(100, baseScore + Math.floor(Math.random() * 8) - 4))
  const logic = Math.max(0, Math.min(100, baseScore + Math.floor(Math.random() * 8) - 4))
  const expression = Math.max(0, Math.min(100, baseScore + Math.floor(Math.random() * 8) - 4))
  
  return { overall, content, logic, expression }
}

// 为单个问题生成反馈
function generateQuestionFeedback(evaluationResult: any, question: string, answer: string, index: number): string {
  if (!evaluationResult || !answer.trim()) {
    return '建议提供更详细的回答，包含具体的案例和数据支撑。'
  }
  
  // 从整体反馈中提取相关建议
  const improvements = evaluationResult.improvements || []
  const strengths = evaluationResult.strengths || []
  
  let feedback = ''
  
  if (strengths.length > 0 && index < strengths.length) {
    feedback += `优势：${strengths[index]?.description || strengths[0]?.description}\n\n`
  }
  
  if (improvements.length > 0) {
    const improvement = improvements[index % improvements.length]
    feedback += `改进建议：${improvement?.suggestion || '建议提供更具体的案例和数据支撑。'}\n\n`
    
    if (improvement?.example) {
      feedback += `参考示例：${improvement.example}`
    }
  }
  
  return feedback || '回答有一定基础，建议增加更多具体案例和量化数据来支撑观点。'
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // 获取当前会话和用户
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session?.user) {
      return NextResponse.json(
        { error: '用户认证失败' },
        { status: 401 }
      )
    }
    
    const user = session.user

    // 获取用户的练习记录
    const { data: sessions, error: sessionsError } = await supabase
      .from('practice_sessions')
      .select(`
        *,
        interview_questions(question_text),
        interview_stages(stage_name),
        question_categories(category_name)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    if (sessionsError) {
      console.error('❌ [API] 获取练习记录失败:', sessionsError)
      return NextResponse.json(
        { error: '获取练习记录失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      sessions: sessions || []
    })
    
  } catch (error) {
    console.error('💥 [API] 获取练习记录错误:', error)
    return NextResponse.json(
      {
        error: '获取练习记录失败',
        message: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}