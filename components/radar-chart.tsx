"use client"

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts"

interface RadarChartProps {
  coreCompetencyScores: {
    productThinking: number
    technicalUnderstanding: number
    projectManagement: number
    businessAcumen: number
  }
}

export function CoreCompetencyRadarChart({ coreCompetencyScores }: RadarChartProps) {
  const data = [
    {
      dimension: "产品思维",
      score: coreCompetencyScores.productThinking,
      fullMark: 10,
    },
    {
      dimension: "技术理解",
      score: coreCompetencyScores.technicalUnderstanding,
      fullMark: 10,
    },
    {
      dimension: "项目管理",
      score: coreCompetencyScores.projectManagement,
      fullMark: 10,
    },
    {
      dimension: "商业化能力",
      score: coreCompetencyScores.businessAcumen,
      fullMark: 10,
    },
  ]

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="dimension" className="text-sm" />
          <PolarRadiusAxis angle={90} domain={[0, 10]} tick={false} axisLine={false} />
          <Radar
            name="得分"
            dataKey="score"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary))"
            fillOpacity={0.2}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
