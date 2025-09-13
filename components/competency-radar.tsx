'use client'

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts'
import type { CompetencyScores } from '../types/evaluation'

/**
 * 核心能力雷达图组件
 * 用于可视化展示用户在五个维度的能力评分
 */
interface CompetencyRadarProps {
  /** 能力评分数据（平均分） */
  competencyScores?: CompetencyScores
  /** 图表高度，默认 300px */
  height?: number
  /** 是否显示网格，默认 true */
  showGrid?: boolean
}

export function CompetencyRadar({ 
  competencyScores, 
  height = 300, 
  showGrid = true 
}: CompetencyRadarProps) {
  // 提供默认值以防止undefined错误
  const safeScores = {
    内容质量: competencyScores?.内容质量 || 0,
    逻辑思维: competencyScores?.逻辑思维 || 0,
    表达能力: competencyScores?.表达能力 || 0,
    创新思维: competencyScores?.创新思维 || 0,
    问题分析: competencyScores?.问题分析 || 0
  }



  // 将评分数据转换为雷达图所需的格式
  const radarData = [
    {
      competency: '内容质量',
      averageScore: safeScores.内容质量,
      fullMark: 5
    },
    {
      competency: '逻辑思维',
      averageScore: safeScores.逻辑思维,
      fullMark: 5
    },
    {
      competency: '表达能力',
      averageScore: safeScores.表达能力,
      fullMark: 5
    },
    {
      competency: '创新思维',
      averageScore: safeScores.创新思维,
      fullMark: 5
    },
    {
      competency: '问题分析',
      averageScore: safeScores.问题分析,
      fullMark: 5
    }
  ]

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <RadarChart data={radarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
          {showGrid && (
            <PolarGrid 
              stroke="#e2e8f0" 
              strokeWidth={1}
              className="opacity-60"
            />
          )}
          
          <PolarAngleAxis 
            dataKey="competency" 
            tick={{ 
              fontSize: 12, 
              fill: '#64748b',
              fontWeight: 500
            }}
            className="text-slate-600"
          />
          
          <PolarRadiusAxis 
            angle={90} 
            domain={[0, 5]} 
            tick={{ 
              fontSize: 10, 
              fill: '#94a3b8'
            }}
            tickCount={6}
            className="text-slate-400"
          />
          
          {/* 平均分线条（蓝色） */}
          <Radar
            name="平均分"
            dataKey="averageScore"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.15}
            strokeWidth={2}
            dot={{ 
              fill: '#3b82f6', 
              strokeWidth: 2, 
              r: 4 
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
      
      {/* 评分说明和图例 */}
      <div className="mt-4 space-y-2">
        <div className="flex justify-center items-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-slate-600">平均分</span>
          </div>
        </div>
        <p className="text-sm text-slate-500 text-center">
          评分范围：1-5分 | 当前平均分：{(Object.values(safeScores).reduce((a, b) => a + b, 0) / 5).toFixed(1)}分
        </p>
      </div>
    </div>
  )
}

/**
 * 简化版雷达图组件（用于较小的展示空间）
 */
export function CompetencyRadarMini({ competencyScores }: { competencyScores?: CompetencyScores }) {
  return (
    <CompetencyRadar 
      competencyScores={competencyScores} 
      height={200} 
      showGrid={false}
    />
  )
}

/**
 * 默认导出主组件
 */
export default CompetencyRadar