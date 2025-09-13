import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PracticeGroupDetail } from './client'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function PracticeGroupDetailPage({ params }: PageProps) {
  const supabase = await createSupabaseServerClient()
  const { id } = await params
  
  // 获取当前用户
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  // 获取基准练习记录
  const { data: baseSession, error: baseError } = await supabase
    .from('practice_sessions')
    .select(`
      *,
      interview_questions!inner(*),
      interview_stages!inner(*)
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (baseError || !baseSession) {
    redirect('/practice-history')
  }

  // 计算时间段（前后30分钟）
  const baseTime = new Date(baseSession.created_at)
  const startTime = new Date(baseTime.getTime() - 30 * 60 * 1000)
  const endTime = new Date(baseTime.getTime() + 30 * 60 * 1000)

  // 获取同一时间段内的所有练习记录
  const { data: groupSessions, error: groupError } = await supabase
    .from('practice_sessions')
    .select(`
      *,
      interview_questions!inner(*),
      interview_stages!inner(*)
    `)
    .eq('user_id', user.id)
    .gte('created_at', startTime.toISOString())
    .lte('created_at', endTime.toISOString())
    .order('created_at', { ascending: true })

  if (groupError) {
    redirect('/practice-history')
  }

  return (
    <PracticeGroupDetail 
      sessions={groupSessions || []} 
      baseSession={baseSession}
    />
  )
}