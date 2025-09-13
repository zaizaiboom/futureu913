'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Target, Lightbulb, ArrowRight, BarChart3 } from 'lucide-react'

interface CompetencyData {
  name: string
  current: number
  previous: number
  historical: number
  fullMark: number
}

interface ComparisonAnalysisProps {
  competencyData: CompetencyData[]
  lastScores: {
    content_score: number
    logic_score: number
    expression_score: number
    overall_score: number
  }
  historicalAverageScores: {
    content_score: number
    logic_score: number
    expression_score: number
    overall_score: number
  }
  growthInsights: {
    id: string
    type: 'improvement' | 'strength' | 'concern' | 'opportunity'
    title: string
    description: string
    impact: 'high' | 'medium' | 'low'
  }[]
}

interface AnalysisInsight {
  type: 'strength' | 'improvement' | 'trend' | 'scenario'
  title: string
  description: string
  icon: React.ReactNode
  color: string
  bgColor: string
}

export function ComparisonAnalysis({ 
  competencyData, 
  lastScores, 
  historicalAverageScores 
}: ComparisonAnalysisProps) {
  
  // 生成分析洞察
  const generateInsights = (): AnalysisInsight[] => {
    const insights: AnalysisInsight[] = []
    
    // 找出最强能力
    const strongestCompetency = competencyData.reduce((prev, current) => 
      prev.current > current.current ? prev : current
    )
    
    // 找出进步最大的能力
    const mostImprovedCompetency = competencyData.reduce((prev, current) => {
      const prevImprovement = prev.current - prev.previous
      const currentImprovement = current.current - current.previous
      return prevImprovement > currentImprovement ? prev : current
    })
    
    // 找出需要关注的能力
    const needsAttentionCompetency = competencyData.find(comp => 
      comp.current < comp.historical && comp.current < 70
    )
    
    // 总体表现分析
    const overallImprovement = lastScores.overall_score - historicalAverageScores.overall_score
    
    // 核心优势洞察
    insights.push({
      type: 'strength',
      title: `核心优势：${strongestCompetency.name}`,
      description: `你在${strongestCompetency.name}方面表现突出，得分${strongestCompetency.current}分，超过历史平均${strongestCompetency.current - strongestCompetency.historical}分。这是你的核心竞争力，建议在面试中重点展示相关案例。`,
      icon: <Target className="h-5 w-5" />,
      color: 'text-green-700',
      bgColor: 'bg-green-50 border-green-200'
    })
    
    // 进步趋势洞察
    if (mostImprovedCompetency.current > mostImprovedCompetency.previous) {
      insights.push({
        type: 'trend',
        title: `显著进步：${mostImprovedCompetency.name}`,
        description: `${mostImprovedCompetency.name}提升了${mostImprovedCompetency.current - mostImprovedCompetency.previous}分，展现出良好的学习能力。继续保持这种进步势头，建议多练习相关题型来巩固提升。`,
        icon: <TrendingUp className="h-5 w-5" />,
        color: 'text-blue-700',
        bgColor: 'bg-blue-50 border-blue-200'
      })
    }
    
    // 关注点洞察
    if (needsAttentionCompetency) {
      insights.push({
        type: 'improvement',
        title: `重点关注：${needsAttentionCompetency.name}`,
        description: `${needsAttentionCompetency.name}当前得分${needsAttentionCompetency.current}分，低于历史平均水平。建议针对性练习，重点提升这一能力维度的表现。`,
        icon: <TrendingDown className="h-5 w-5" />,
        color: 'text-orange-700',
        bgColor: 'bg-orange-50 border-orange-200'
      })
    }
    
    // 情景化建议
    if (overallImprovement > 0) {
      insights.push({
        type: 'scenario',
        title: '面试场景应用',
        description: `基于你的能力提升趋势，在面试中可以重点强调你的${strongestCompetency.name}，并用具体案例展示你在${mostImprovedCompetency.name}方面的成长经历。这种组合能够很好地展现你的潜力和学习能力。`,
        icon: <Lightbulb className="h-5 w-5" />,
        color: 'text-purple-700',
        bgColor: 'bg-purple-50 border-purple-200'
      })
    }
    
    return insights
  }
  
  const insights = generateInsights()
  
  // 计算整体趋势
  const overallTrend = lastScores.overall_score - historicalAverageScores.overall_score
  const trendDirection = overallTrend > 0 ? 'up' : overallTrend < 0 ? 'down' : 'stable'
  
  return (
    <Card className="bg-white dark:bg-gray-950 rounded-2xl shadow-lg border-0">
      <CardHeader>
        <CardTitle className="flex items-center">
          <BarChart3 className="w-6 h-6 mr-3 text-indigo-500" />
          <span className="text-lg font-semibold text-gray-800 dark:text-gray-200">数据叙事与对比分析</span>
        </CardTitle>
        <p className="text-gray-600 text-sm mt-1">基于历史数据的深度分析和个性化洞察</p>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* 整体趋势概览 */}
        <div className="p-5 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-800">整体表现趋势</h3>
            <Badge 
              variant="outline" 
              className={`font-semibold text-sm ${
                trendDirection === 'up' ? 'text-green-600 bg-green-100 border-green-200' :
                trendDirection === 'down' ? 'text-red-600 bg-red-100 border-red-200' :
                'text-gray-600 bg-gray-100 border-gray-200'
              }`}
            >
              {trendDirection === 'up' && <TrendingUp className="h-4 w-4 mr-1" />}
              {trendDirection === 'down' && <TrendingDown className="h-4 w-4 mr-1" />}
              {overallTrend > 0 ? `+${overallTrend}` : overallTrend}分
            </Badge>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">
            {trendDirection === 'up' && 
              `你的整体表现呈上升趋势，当前得分比历史平均高出${overallTrend}分。这表明你的学习方法有效，持续练习正在带来积极的改变。`
            }
            {trendDirection === 'down' && 
              `当前表现略低于历史平均水平${Math.abs(overallTrend)}分。这可能是正常的波动，建议保持练习频率，重点关注薄弱环节。`
            }
            {trendDirection === 'stable' && 
              `你的表现保持稳定，与历史平均水平基本一致。可以尝试挑战更高难度的题目来实现突破。`
            }
          </p>
        </div>
        
        {/* 详细洞察列表 */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200">深度洞察</h3>
          {insights.map((insight, index) => (
            <div 
              key={index}
              className={`p-4 rounded-lg border ${insight.bgColor} transition-all hover:shadow-lg hover:border-transparent`}
            >
              <div className="flex items-start gap-4">
                <div className={`flex-shrink-0 ${insight.color} mt-1`}>
                  {insight.icon}
                </div>
                <div className="flex-1">
                  <h4 className={`font-semibold mb-1 ${insight.color}`}>
                    {insight.title}
                  </h4>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {insight.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}