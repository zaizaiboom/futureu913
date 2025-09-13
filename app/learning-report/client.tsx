'use client'

import { useState } from 'react'
import Link from 'next/link'
import ActionHandbook from './action-handbook'
import CompetencyDiagnosis from './competency-diagnosis'
import { Button } from '@/components/ui/button'
import type { CompetencyScores } from '@/types/evaluation'

interface LearningReportData {
  sessions: any[]
  totalSessions: number
  diagnosis: any
  actionHandbook: any
  growthData: any[]
  abilities: string[]
  averageCompetencyScores?: CompetencyScores
}

interface LearningReportClientProps {
  initialData: LearningReportData
}

export default function LearningReportClient({ initialData }: LearningReportClientProps) {
  const [activeModule, setActiveModule] = useState('diagnosis')

  const latestGrowth = initialData.growthData[initialData.growthData.length - 1] || {};
  const scores = initialData.abilities.map(ability => latestGrowth[ability] || 0);

  // 默认的能力评分数据（如果没有历史数据）
  const defaultCompetencyScores: CompetencyScores = {
    内容质量: 3.0,
    逻辑思维: 3.0,
    表达能力: 3.0,
    创新思维: 3.0,
    问题分析: 3.0
  }





  const modules = {
    diagnosis: { 
      title: '你的成长轨迹', 
      component: (
        <CompetencyDiagnosis 
          averageScores={initialData.averageCompetencyScores || defaultCompetencyScores}
          showDetailedAnalysis={true}
          totalPracticeSessions={initialData.totalSessions}
          feedbackHistory={initialData.sessions || []}
        />
      ) 
    }
  }

  return (
    <div className="p-4 sm:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">学习报告</h1>
              <span className="text-sm sm:text-base text-gray-600 font-medium">总练习次数: {initialData.totalSessions}</span>
            </div>
          </div>
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-0">
            <div className="w-full lg:w-48 lg:pr-4">
              <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800">{modules[activeModule as keyof typeof modules].title}</h2>
            </div>
            </div>
            <div className="flex-1">
              {modules[activeModule as keyof typeof modules].component}
            </div>
          </div>
        </div>
      </div>
  )
}