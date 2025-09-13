import { createClient } from '@/lib/supabase/server'
export const runtime = 'nodejs'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const supabase = await createClient()
    
    // 获取当前用户
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      // 如果用户未登录，返回404
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 })
    }

    // 查询特定练习记录
    const { data: session, error } = await supabase
      .from('practice_sessions')
      .select(`
        id,
        created_at,
        overall_score,
        content_score,
        logic_score,
        expression_score,
        ai_feedback,
        interview_questions(
          question_text
        ),
        interview_stages(
          stage_name
        ),
        question_categories(
          category_name
        )
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Practice session not found' }, { status: 404 })
      }
      console.error('Error fetching practice session:', error)
      return NextResponse.json({ error: 'Failed to fetch practice session' }, { status: 500 })
    }

    // 解析AI反馈数据
    let aiFeedback = null
    try {
      aiFeedback = session.ai_feedback ? JSON.parse(session.ai_feedback) : null
    } catch (e) {
      console.warn('Failed to parse AI feedback:', e)
    }

    // 格式化数据
    const formattedInterview = {
      id: session.id,
      date: session.created_at,
      completedAt: session.created_at, // 练习完成时间就是创建时间
      totalScore: session.overall_score,
      status: 'completed', // 所有保存的练习都是已完成状态
      questionCount: 1, // 每个练习记录对应一个问题
      stageName: session.interview_stages?.[0]?.stage_name || '未知阶段',
      categoryName: session.question_categories?.[0]?.category_name || '未知分类',
      scores: {
        content: session.content_score,
        logic: session.logic_score,
        expression: session.expression_score
      },
      question: session.interview_questions?.[0]?.question_text || '问题加载失败',
      aiFeedback: aiFeedback,
      questions: [{
        id: session.id,
        question: session.interview_questions?.[0]?.question_text || '问题加载失败',
        answer: '用户回答', // 实际回答内容可能需要从其他地方获取
        feedback: aiFeedback ? JSON.stringify(aiFeedback) : '暂无反馈',
        score: session.overall_score,
        createdAt: session.created_at
      }]
    }

    return NextResponse.json({ interview: formattedInterview })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}