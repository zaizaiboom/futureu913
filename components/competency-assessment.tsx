'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, CheckCircle, AlertTriangle, Target } from 'lucide-react'
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip
} from 'recharts'

interface CompetencyData {
  name: string
  current: number
  previous: number
  historical: number
  fullMark: number
}

interface GrowthInsight {
  competency: string
  status: 'progress' | 'stagnant' | 'decline'
  description: string
  change: string
}

interface CompetencyAssessmentProps {
  competencyData?: CompetencyData[]
  growthInsights?: GrowthInsight[]
  lastScores?: {
    content_score: number
    logic_score: number
    expression_score: number
    overall_score: number
  }
  historicalAverageScores?: {
    content_score: number
    logic_score: number
    expression_score: number
    overall_score: number
  }
}

// 模拟数据
const defaultCompetencyData: CompetencyData[] = [
  { name: '战略思维力', current: 75, previous: 65, historical: 70, fullMark: 100 },
  { name: '落地执行力', current: 80, previous: 75, historical: 77, fullMark: 100 },
  { name: '沟通表达力', current: 70, previous: 72, historical: 68, fullMark: 100 },
  { name: '团队协作力', current: 85, previous: 80, historical: 82, fullMark: 100 },
  { name: '创新思维力', current: 68, previous: 60, historical: 64, fullMark: 100 },
  { name: '学习适应力', current: 90, previous: 85, historical: 87, fullMark: 100 }
]

const defaultGrowthInsights: GrowthInsight[] = [
  {
    competency: '战略思维力',
    status: 'progress',
    description: '从基础具备提升至初步成型。你开始在回答中融入市场分析和竞品考量，展现出更全面的思考视角。',
    change: '+10分'
  },
  {
    competency: '学习适应力',
    status: 'progress', 
    description: '持续保持优秀水平。你能够快速理解新概念并灵活运用，这是你的核心优势。',
    change: '+5分'
  },
  {
    competency: '沟通表达力',
    status: 'decline',
    description: '略有下降，需要关注。建议在回答时更注重逻辑结构和表达清晰度。',
    change: '-2分'
  },
  {
    competency: '创新思维力',
    status: 'progress',
    description: '显著提升。你开始提出更多创新性的解决方案，思维更加发散和灵活。',
    change: '+8分'
  },
  {
    competency: '落地执行力',
    status: 'progress',
    description: '执行能力稳步提升，建议继续实践项目管理。',
    change: '+5分'
  },
  {
    competency: '团队协作力',
    status: 'progress',
    description: '协作能力优秀，团队互动更顺畅。',
    change: '+5分'
  }
]

export function CompetencyAssessment({ 
  competencyData = defaultCompetencyData,
  growthInsights = defaultGrowthInsights,
  lastScores,
  historicalAverageScores
}: CompetencyAssessmentProps) {
  
  // 准备雷达图数据
  const radarData = competencyData.map(item => ({
    subject: item.name,
    当前得分: item.current,
    历史平均: item.historical,
    fullMark: item.fullMark
  }))

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'progress':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'decline':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'progress':
        return 'text-green-600'
      case 'decline':
        return 'text-red-600'
      default:
        return 'text-yellow-600'
    }
  }

  return (
    <Card className="bg-white dark:bg-gray-950 rounded-2xl shadow-lg border-0">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Target className="w-6 h-6 mr-3 text-blue-500" />
          <span className="text-lg font-semibold text-gray-800 dark:text-gray-200">核心能力评估与成长路径</span>
        </CardTitle>
        <p className="text-gray-600 text-sm mt-1">基于最近练习数据的能力分析与发展建议</p>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-5">
        {/* 雷达图部分 */}
        <div className="lg:col-span-3 p-6 bg-gray-50 dark:bg-gray-900 rounded-xl">
          <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-4 text-center">能力雷达图对比</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                <PolarGrid gridType="polygon" radialLines={true} />
                <PolarAngleAxis 
                  dataKey="subject" 
                  tick={{ fontSize: 12, fill: '#4b5563' }}
                />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tickCount={6} tick={{ fontSize: 10, fill: '#6b7280' }} />
                <Radar
                  name="历史平均"
                  dataKey="历史平均"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
                <Radar
                  name="当前得分"
                  dataKey="当前得分"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.25}
                  strokeWidth={2.5}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                <Tooltip contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(4px)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                }}/>
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 成长洞察部分 */}
        <div className="lg:col-span-2 space-y-4">
           <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200">成长洞察</h3>
            {growthInsights.map((insight, index) => (
              <div 
                key={index}
                className="p-4 rounded-lg border border-gray-200 bg-white hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex-shrink-0">
                    {getStatusIcon(insight.status)}
                  </div>
                  <h4 className="font-semibold text-gray-800 text-sm">{insight.competency}</h4>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getStatusColor(insight.status)} border-current`}
                  >
                    {insight.change}
                  </Badge>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed pl-7">
                  {insight.description}
                </p>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  )
}