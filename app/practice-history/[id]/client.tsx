'use client'

import { User } from '@supabase/supabase-js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Clock, Target, CheckCircle, AlertTriangle, Lightbulb, Star, TrendingUp } from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import Link from 'next/link'
import Navigation from '@/components/navigation'
import { PracticeSession } from '@/types/practice-session'
import { QualitativeFeedback, FeedbackDetail, ActionItem } from '@/types/qualitative-feedback'

interface PracticeSessionDetailProps {
  user: User
  sessions: PracticeSession[]
  learningReport: any
}

export function PracticeSessionDetail({ user, sessions, learningReport }: PracticeSessionDetailProps) {
  // 使用第一个session作为基础信息
  const baseSession = sessions[0]
  // 解析学习报告数据
  const parseLearningReport = () => {
    try {
      if (learningReport && typeof learningReport === 'object') {
        return learningReport
      }
      if (typeof learningReport === 'string') {
        return JSON.parse(learningReport)
      }
      return null
    } catch (error) {
      console.error('解析学习报告失败:', error)
      return null
    }
  }

  const reportData = parseLearningReport()
  
  // 计算平均分数
  const averageScore = Math.round(sessions.reduce((sum, s) => sum + (s.overall_score || 0), 0) / sessions.length)

  // 获取分数颜色
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  // 获取等级颜色
  const getLevelColor = (level: string) => {
    if (level.includes('导演级')) return 'bg-purple-100 text-purple-800'
    if (level.includes('制片级')) return 'bg-blue-100 text-blue-800'
    if (level.includes('编剧级')) return 'bg-green-100 text-green-800'
    if (level.includes('助理级')) return 'bg-orange-100 text-orange-800'
    return 'bg-gray-100 text-gray-800'
  }

  return (
    <>
      <Navigation currentPage="practice-history" />
      <div className="p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          {/* 返回按钮和标题 */}
          <div className="flex items-center gap-4 mb-6">
            <Button variant="outline" size="sm" asChild>
              <Link href="/practice-history">
                <ArrowLeft className="h-4 w-4 mr-2" />
                返回记录
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">套题练习详情</h1>
              <p className="text-sm text-gray-600">
                {format(new Date(baseSession.created_at), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}
              </p>
              <p className="text-sm text-gray-500">
                共 {sessions.length} 道题目
              </p>
            </div>
          </div>

          {/* 基本信息卡片 */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">套题信息</CardTitle>
                  <CardDescription>本次练习概览</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getLevelColor(baseSession.interview_stages?.stage_name || '')}>
                    {baseSession.interview_stages?.stage_name}
                  </Badge>
                  <Badge variant="outline">
                    {baseSession.question_categories?.category_name}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* 平均分显示已移除 */}
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <p className="text-sm text-gray-600">题目数</p>
                  <p className="text-xl font-bold text-gray-800">
                    {sessions.length}
                  </p>
                </div>
                {/* 最高分显示已移除 */}
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Clock className="h-5 w-5 text-orange-600" />
                  </div>
                  <p className="text-sm text-gray-600">总用时</p>
                  <p className="text-xl font-bold text-gray-800">
                    {Math.round(sessions.reduce((sum, s) => sum + (s.practice_duration || 0), 0) / 60)}分钟
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 题目和答案 */}
          <div className="space-y-6 mb-6">
            {sessions.map((session, index) => (
              <Card key={session.id}>
                <CardHeader>
                  <CardTitle className="text-lg">第 {index + 1} 题</CardTitle>
                  <CardDescription>
                    {session.interview_questions?.question_text}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">我的回答</h3>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-gray-700 leading-relaxed">
                        {session.user_answer || '未回答'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">参考答案</h3>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-gray-700 leading-relaxed">
                        {session.interview_questions?.expected_answer || '暂无参考答案'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-end pt-2 border-t">
                    <div className="text-sm text-gray-500">
                      用时: {Math.round((session.practice_duration || 0) / 60)} 分钟
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 学习报告 */}
          {reportData && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  学习报告
                </CardTitle>
                <CardDescription>本套题的综合分析与建议</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 总体评估 */}
                {reportData.overallSummary && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="h-5 w-5 text-blue-600" />
                      <h3 className="font-semibold text-gray-900">总体评估</h3>
                      <Badge className={getLevelColor(reportData.overallSummary.overallLevel)}>
                        {reportData.overallSummary.overallLevel}
                      </Badge>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-gray-700 leading-relaxed">
                        {reportData.overallSummary.summary}
                      </p>
                    </div>
                  </div>
                )}

                <Separator />

                {/* 表现亮点 */}
                {reportData.overallSummary?.strengths && reportData.overallSummary.strengths.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <h3 className="font-semibold text-gray-900">表现亮点</h3>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <ul className="space-y-3">
                        {reportData.overallSummary.strengths.map((strength: any, index: number) => (
                          <li key={index} className="flex items-start gap-3">
                            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-medium text-gray-800">{strength.competency}</p>
                              <p className="text-gray-700 text-sm">{strength.description}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                <Separator />

                {/* 改进建议 */}
                {reportData.overallSummary?.improvements && reportData.overallSummary.improvements.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="h-5 w-5 text-orange-600" />
                      <h3 className="font-semibold text-gray-900">改进建议</h3>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <ul className="space-y-3">
                        {reportData.overallSummary.improvements.map((improvement: any, index: number) => (
                          <li key={index} className="flex items-start gap-3">
                            <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-medium text-gray-800">{improvement.competency}</p>
                              <p className="text-gray-700 text-sm mb-1">{improvement.suggestion}</p>
                              {improvement.example && (
                                <p className="text-gray-600 text-xs italic">示例：{improvement.example}</p>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                <Separator />

                {/* 单题评估 */}
                {reportData.individualEvaluations && reportData.individualEvaluations.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Lightbulb className="h-5 w-5 text-purple-600" />
                      <h3 className="font-semibold text-gray-900">单题评估</h3>
                    </div>
                    <div className="space-y-4">
                      {reportData.individualEvaluations.map((evaluation: any, index: number) => (
                        <div key={index} className="bg-purple-50 p-4 rounded-lg">
                          <div className="flex items-start gap-3">
                            <div className="bg-purple-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center mt-0.5 flex-shrink-0">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-800 mb-2">{evaluation.questionContent}</p>
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className={getLevelColor(evaluation.performanceLevel)}>
                                  {evaluation.performanceLevel}
                                </Badge>
                              </div>
                              <p className="text-gray-700 text-sm">{evaluation.summary}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* 操作按钮 */}
          <div className="flex justify-center gap-4">
            <Button variant="outline" asChild>
              <Link href="/practice-history">
                返回记录列表
              </Link>
            </Button>
            <Button asChild>
              <Link href="/interview-practice">
                继续练习
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}