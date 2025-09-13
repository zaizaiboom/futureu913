import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // 获取当前用户
    const { data, error: userError } = await supabase.auth.getUser()
    const user = data?.user ?? null
    
    if (userError || !user) {
      // 如果用户未登录，返回空的面试记录列表
      return NextResponse.json({ interviews: [] })
    }

    // 查询用户的面试记录
    const { data: interviews, error } = await supabase
      .from('interview_sessions')
      .select(`
        id,
        created_at,
        completed_at,
        total_score,
        status,
        interview_answers (
          id,
          question_text,
          user_answer,
          ai_feedback,
          score,
          created_at
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching interviews:', error)
      return NextResponse.json({ error: 'Failed to fetch interviews' }, { status: 500 })
    }

    // 格式化数据
    const formattedInterviews = interviews?.map(interview => ({
      id: interview.id,
      date: interview.created_at,
      completedAt: interview.completed_at,
      totalScore: interview.total_score,
      status: interview.status,
      questionCount: interview.interview_answers?.length || 0,
      questions: interview.interview_answers?.map(answer => ({
        id: answer.id,
        question: answer.question_text,
        answer: answer.user_answer,
        feedback: answer.ai_feedback,
        score: answer.score,
        createdAt: answer.created_at
      })) || []
    })) || []

    return NextResponse.json({ interviews: formattedInterviews })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}