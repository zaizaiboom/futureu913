import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import LearningReportClient from './client'
import type { CompetencyScores } from '@/types/evaluation'

export const dynamic = 'force-dynamic'

interface PracticeSession {
  id: string
  overall_score: number
  content_score: number
  logic_score: number
  expression_score: number
  created_at: string
  interview_questions: {
    question_text: string
  }
  interview_stages: {
    stage_name: string
  }
  question_categories: {
    category_name: string
  }
}

interface LearningReportData {
  user: any
  sessions: PracticeSession[]
  totalSessions: number
  averageScore: number
  improvementTrend: number
  actionHandbook: { improvementArea: string; recommendedArticle: string; practiceQuestion: string; thinkingTool: string }
  growthData: { date: string; [key: string]: number | string }[]
  abilities: string[]
  averageCompetencyScores?: CompetencyScores
}

async function getLearningReportData(): Promise<LearningReportData | null> {
  try {
    const supabase = await createClient()
    
    // 获取用户信息
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('用户认证失败:', userError)
      return null
    }

    // 获取练习会话数据
    const { data: sessionsData, error: sessionsError } = await supabase
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
      console.error('获取练习数据失败:', sessionsError)
      return {
        user,
        sessions: [],
        totalSessions: 0,
        averageScore: 0,
        improvementTrend: 0,
        actionHandbook: {
          improvementArea: '',
          recommendedArticle: '',
          practiceQuestion: '',
          thinkingTool: ''
        },
        growthData: [],
        abilities: []
      }
    }

    const sessions = sessionsData || []
    const totalSessions = sessions.length
    const averageScore = totalSessions > 0 
      ? sessions.reduce((sum, session) => sum + (session.overall_score || 0), 0) / totalSessions
      : 0

    // 计算进步趋势（最近5次与之前5次的平均分对比）
    let improvementTrend = 0
    if (totalSessions >= 10) {
      const recent5 = sessions.slice(0, 5)
      const previous5 = sessions.slice(5, 10)
      const recentAvg = recent5.reduce((sum, s) => sum + (s.overall_score || 0), 0) / 5
      const previousAvg = previous5.reduce((sum, s) => sum + (s.overall_score || 0), 0) / 5
      improvementTrend = recentAvg - previousAvg
    }

    // 计算各维度平均分（从历史练习数据中提取）
    let averageCompetencyScores: CompetencyScores | undefined
    
    if (totalSessions > 0) {
      // 从练习会话中获取评估结果并计算平均分
      const { data: evaluationResults, error: evalError } = await supabase
        .from('evaluation_results')
        .select('competency_scores')
        .eq('user_id', user.id)
        .not('competency_scores', 'is', null)
      
      if (!evalError && evaluationResults && evaluationResults.length > 0) {
        // 计算各维度的平均分
        const competencyTotals = {
          内容质量: 0,
          逻辑思维: 0,
          表达能力: 0,
          创新思维: 0,
          问题分析: 0
        }
        let validCount = 0
        
        evaluationResults.forEach(result => {
          if (result.competency_scores && typeof result.competency_scores === 'object') {
            const scores = result.competency_scores as CompetencyScores
            Object.keys(competencyTotals).forEach(key => {
              const competencyKey = key as keyof CompetencyScores
              if (scores[competencyKey] && typeof scores[competencyKey] === 'number') {
                competencyTotals[competencyKey] += scores[competencyKey]
              }
            })
            validCount++
          }
        })
        
        if (validCount > 0) {
          averageCompetencyScores = {
            内容质量: Number((competencyTotals.内容质量 / validCount).toFixed(1)),
            逻辑思维: Number((competencyTotals.逻辑思维 / validCount).toFixed(1)),
            表达能力: Number((competencyTotals.表达能力 / validCount).toFixed(1)),
            创新思维: Number((competencyTotals.创新思维 / validCount).toFixed(1)),
            问题分析: Number((competencyTotals.问题分析 / validCount).toFixed(1))
          }
        }
      }
    }
    
    // 如果没有历史数据，使用模拟数据
    if (!averageCompetencyScores) {
      averageCompetencyScores = {
        内容质量: 3.2,
        逻辑思维: 2.8,
        表达能力: 3.5,
        创新思维: 2.5,
        问题分析: 3.0
      }
    }
    
    const actionHandbook = {
      improvementArea: 'AI问题建模',
      recommendedArticle: 'AI建模基础',
      practiceQuestion: '描述一个AI问题的建模过程',
      thinkingTool: 'SWOT分析'
    }
    
    const abilities = ['产品洞察', 'AI方案构建', '逻辑沟通', '落地迭代']
    const growthData = [
      { date: '2023-01', '产品洞察': 60, 'AI方案构建': 50, '逻辑沟通': 70, '落地迭代': 55 },
      { date: '2023-02', '产品洞察': 65, 'AI方案构建': 55, '逻辑沟通': 75, '落地迭代': 60 },
      // 添加更多数据点
    ]
    
    return {
      user,
      sessions,
      totalSessions,
      averageScore,
      improvementTrend,
      actionHandbook,
      growthData,
      abilities,
      averageCompetencyScores
    }
  } catch (error) {
    console.error('获取学习报告数据时发生错误:', error)
    return null
  }
}

export default async function LearningReportPage() {
  const data = await getLearningReportData()
  
  if (!data) {
    redirect('/auth/login?redirectTo=/learning-report')
  }

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">加载中...</span>
      </div>
    }>
      <LearningReportClient 
        initialData={{
          sessions: data.sessions,
          totalSessions: data.totalSessions,
          diagnosis: null,
          actionHandbook: data.actionHandbook,
          growthData: data.growthData,
          abilities: data.abilities,
          averageCompetencyScores: data.averageCompetencyScores
        }}
      />
    </Suspense>
  )
}