import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { PracticeSessionDetail } from './client'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function PracticeSessionDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = createServerComponentClient({ cookies })
  
  // 获取当前用户
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  // 首先获取指定ID的练习记录以获取session_id
  const { data: baseSession, error: baseError } = await supabase
    .from('practice_sessions')
    .select('session_id, learning_report')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (baseError || !baseSession) {
    redirect('/practice-history')
  }

  // 获取同一session_id的所有练习记录
  const { data: sessions, error } = await supabase
    .from('practice_sessions')
    .select(`
      *,
      interview_questions(*),
      interview_stages(*),
      question_categories(*)
    `)
    .eq('session_id', baseSession.session_id)
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (error || !sessions || sessions.length === 0) {
    redirect('/practice-history')
  }

  return <PracticeSessionDetail user={user} sessions={sessions} learningReport={baseSession.learning_report} />
}