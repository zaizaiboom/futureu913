'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, Target, TrendingUp, Eye, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { PracticeSession } from '@/types/practice-session'

interface PracticeGroupDetailProps {
  sessions: PracticeSession[]
  baseSession: PracticeSession
}

export function PracticeGroupDetail({ sessions, baseSession }: PracticeGroupDetailProps) {
  // 计算统计数据 - 只统计有用户回答的题目
  const answeredSessions = sessions.filter(s => s.user_answer && s.user_answer.trim() !== '')
  const stats = {
    totalSessions: answeredSessions.length, // 只统计用户实际回答的题目数
    averageScore: answeredSessions.length > 0 
      ? answeredSessions.reduce((sum, s) => sum + (s.overall_score || 0), 0) / answeredSessions.length 
      : 0,
    highestScore: answeredSessions.length > 0 
      ? Math.max(...answeredSessions.map(s => s.overall_score || 0)) 
      : 0
  }

  // 获取分数颜色
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  // 获取阶段颜色
  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'behavioral': return 'bg-blue-100 text-blue-800'
      case 'technical': return 'bg-purple-100 text-purple-800'
      case 'case_study': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* 导航 */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/practice-history">
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回记录
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">练习套题详情</h1>
          <p className="text-muted-foreground">
            {new Date(baseSession.created_at).toLocaleString('zh-CN')}
          </p>
        </div>
      </div>



      {/* 题目列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            练习题目列表
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {answeredSessions.map((session, index) => (
              <div key={session.id} className="border rounded-lg p-6">
                <div className="space-y-4">
                  {/* 题目标题和信息 */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-muted-foreground">
                          题目 {index + 1}
                        </span>
                        <Badge className={getStageColor(session.interview_stages?.stage_name || '')}>
                          {session.interview_stages?.stage_name || '未知阶段'}
                        </Badge>
                        {/* AI评估标签已移除 */}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(session.created_at).toLocaleString('zh-CN')}
                      </span>
                      {/* 得分显示已移除 */}
                    </div>
                  </div>
                  
                  {/* 题目内容 */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">题目</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-700 leading-relaxed">
                        {session.interview_questions?.question_text || '题目内容'}
                      </p>
                    </div>
                  </div>
                  
                  {/* 用户回答 */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">我的回答</h3>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-gray-700 leading-relaxed">
                        {session.user_answer || '未回答'}
                      </p>
                    </div>
                  </div>
                  
                  {/* 参考答案 */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">参考答案</h3>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-gray-700 leading-relaxed">
                        {session.interview_questions?.expected_answer || '暂无参考答案'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI评估报告 */}
      {answeredSessions.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              AI评估报告
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* 整体表现分析 */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">整体表现分析</h3>
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
                  <p className="text-gray-700 leading-relaxed">
                    本次练习共完成 <span className="font-semibold text-blue-600">{stats.totalSessions}</span> 道题目。
                    通过练习可以帮助您提升面试技能和知识储备。
                  </p>
                </div>
              </div>

              {/* 能力维度分析 */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">能力维度分析</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2">练习收获</h4>
                    <p className="text-sm text-green-700">
                      通过练习提升了面试技能，积累了答题经验和思路
                    </p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h4 className="font-medium text-orange-800 mb-2">持续改进</h4>
                    <p className="text-sm text-orange-700">
                      可以继续练习更多题目，进一步提升答题的深度和广度
                    </p>
                  </div>
                </div>
              </div>

              {/* 改进建议 */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">改进建议</h3>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <ul className="space-y-2 text-sm text-yellow-800">
                    <li>• 建议系统学习相关基础知识，夯实理论基础</li>
                    <li>• 多练习结构化思维，提升逻辑表达能力</li>
                    <li>• 参考优秀答案，学习答题技巧和思路</li>
                    <li>• 关注行业动态，丰富案例和实践经验</li>
                    <li>• 练习时间管理，在有限时间内给出高质量回答</li>
                  </ul>
                </div>
              </div>

              {/* 下一步行动 */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">下一步行动</h3>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-0.5">
                      1
                    </div>
                    <div>
                      <p className="font-medium text-blue-800">继续练习</p>
                      <p className="text-sm text-blue-700 mt-1">
                        建议每天练习2-3道题目，保持学习节奏
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 mt-3">
                    <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-0.5">
                      2
                    </div>
                    <div>
                      <p className="font-medium text-blue-800">查看学习报告</p>
                      <p className="text-sm text-blue-700 mt-1">
                        定期查看个人学习报告，了解能力成长轨迹
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 操作按钮 */}
      <div className="flex justify-center gap-4 mt-6">
        <Button variant="outline" asChild>
          <Link href="/learning-report">
            查看学习报告
          </Link>
        </Button>
        <Button asChild>
          <Link href="/practice">
            继续练习
          </Link>
        </Button>
      </div>
    </div>
  )
}