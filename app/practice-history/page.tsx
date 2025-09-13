import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PracticeHistoryClient } from './client';
import { QualitativeFeedback } from '@/types/qualitative-feedback';
import { PracticeSession } from '@/types/practice-session';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic'

// Define a more detailed interface for AI feedback
interface AiFeedback {
  summary?: string;
  strengths?: string[];
  improvements?: string[];
  competency_scores?: Record<string, number>;
}



interface PracticeHistoryData {
  user: any
  sessions: PracticeSession[]
  totalSessions: number
  categories: string[]
  stages: string[]
}

async function getPracticeHistoryData(): Promise<PracticeHistoryData | null> {
  try {
    const supabase = await createSupabaseServerClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('用户认证失败:', userError)
      return null
    }

    const { data: sessionsData, error: sessionsError } = await supabase
      .from('practice_sessions')
      .select(`
        *,
        interview_questions(question_text, expected_answer),
        interview_stages(stage_name),
        question_categories(category_name)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (sessionsError) {
      console.error('获取练习数据失败:', sessionsError)
      return {
        user,
        sessions: [],
        totalSessions: 0,
        categories: [],
        stages: []
      }
    }

    const sessions = (sessionsData || []).map(session => {
      let qualitative_feedback: QualitativeFeedback = {
        sessionId: session.id,
        practiceDate: new Date(session.created_at).toISOString().split('T')[0],
        questionText: session.interview_questions?.question_text || '问题文本不可用',
        overallAssessment: {
          level: '暂无评估',
          summary: '暂无评估数据'
        },
        highlights: [],
        suggestions: [],
        actionPlan: [],
      };

      if (session.ai_feedback) {
        try {
          // It's possible ai_feedback is a stringified JSON
          const feedback: AiFeedback = typeof session.ai_feedback === 'string' 
            ? JSON.parse(session.ai_feedback) 
            : session.ai_feedback;

          qualitative_feedback = {
            sessionId: session.id,
            practiceDate: new Date(session.created_at).toISOString().split('T')[0],
            questionText: session.interview_questions?.question_text || '问题文本不可用',
            overallAssessment: {
              level: '助理级表现',
              summary: feedback.summary || '暂无总结'
            },
            highlights: (feedback.strengths || []).map((s: any) => (
              typeof s === 'object' && s !== null
                ? { title: s.competency || '', description: s.description || '' }
                : { title: s, description: '' }
            )),
            suggestions: (feedback.improvements || []).map((i: any) => (
              typeof i === 'object' && i !== null
                ? { title: i.competency || '', description: i.description || '', severity: i.severity || 'moderate' }
                : { title: i, description: '', severity: 'moderate' }
            )),
            actionPlan: (feedback.improvements || []).map((i: any) => {
              const competency = typeof i === 'object' && i !== null ? i.competency : i;
              return { title: `改进 ${competency}`, description: `针对 ${competency} 进行专项练习` };
            }),
          };
        } catch (e) {
          console.error(`Failed to parse ai_feedback for session ${session.id}:`, e);
          qualitative_feedback.overallAssessment.summary = '评估数据解析失败';
        }
      }
      
      return { 
        ...session, 
        qualitative_feedback, 
        practice_duration: session.practice_duration ?? 0,
        ai_feedback: session.ai_feedback ?? ''
      };
    });
    
    const categories = [...new Set(
      sessions
        .map(s => s.question_categories?.category_name)
        .filter(Boolean)
    )]
    
    const stages = [...new Set(
      sessions
        .map(s => s.interview_stages?.stage_name)
        .filter(Boolean)
    )]

    return {
      user,
      sessions,
      totalSessions: sessions.length,
      categories,
      stages
    }
  } catch (error) {
    console.error('获取练习记录数据时发生错误:', error)
    return null
  }
}

export default async function PracticeHistoryPage() {
  const data = await getPracticeHistoryData()
  
  if (!data) {
    redirect('/auth/login?redirectTo=/practice-history')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">练习记录</h1>
        <p className="text-gray-600">查看您的所有练习历史和详细表现</p>
      </div>

      <Suspense fallback={
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">加载中...</span>
        </div>
      }>
        <PracticeHistoryClient 
          user={data.user}
          sessions={data.sessions}
          totalSessions={data.totalSessions}
          categories={data.categories}
          stages={data.stages}
        />
      </Suspense>
    </div>
  )
}