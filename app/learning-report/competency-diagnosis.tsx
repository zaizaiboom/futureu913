'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { TrendingUp, TrendingDown, Minus, Target, Award, AlertCircle, BarChart3 } from 'lucide-react'
import CompetencyRadar from '@/components/competency-radar'
import { ActionableSuggestions } from '@/components/actionable-suggestions'
import type { CompetencyScores } from '@/types/evaluation'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Brain, MessageSquare, Briefcase, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * 核心能力诊断组件的属性接口
 */
interface CompetencyDiagnosisProps {
  /** 历史平均能力评分数据 */
  averageScores: CompetencyScores
  /** 最新一次的能力评分（可选，用于对比） */
  latestScores?: CompetencyScores
  /** 是否显示详细分析，默认 true */
  showDetailedAnalysis?: boolean
  /** 总练习次数 */
  totalPracticeSessions: number
  /** 反馈历史记录 (实际上是 PracticeSession[]) */
  feedbackHistory?: any[]
}

/**
 * 能力维度详细信息
 */
const COMPETENCY_INFO = {
  内容质量: {
    description: '回答的内容深度、准确性和相关性',
    icon: Target,
    color: 'bg-blue-500'
  },
  逻辑思维: {
    description: '回答的逻辑结构、推理能力和条理性',
    icon: TrendingUp,
    color: 'bg-green-500'
  },
  表达能力: {
    description: '回答的表达清晰度、语言组织和沟通效果',
    icon: Award,
    color: 'bg-purple-500'
  },
  创新思维: {
    description: '回答的创新性、独特见解和思维突破',
    icon: AlertCircle,
    color: 'bg-orange-500'
  },
  问题分析: {
    description: '对问题的理解深度、分析角度和解决思路',
    icon: Target,
    color: 'bg-red-500'
  }
} as const

/**
 * 获取能力等级标签
 */
function getCompetencyLevel(score: number): { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } {
  if (score >= 4.5) return { label: '优秀', variant: 'default' }
  if (score >= 3.5) return { label: '良好', variant: 'secondary' }
  if (score >= 2.5) return { label: '一般', variant: 'outline' }
  return { label: '待提升', variant: 'destructive' }
}

/**
 * 获取趋势图标
 */
function getTrendIcon(current: number, previous?: number) {
  if (!previous) return <Minus className="w-4 h-4 text-gray-400" />
  
  if (current > previous) {
    return <TrendingUp className="w-4 h-4 text-green-500" />
  } else if (current < previous) {
    return <TrendingDown className="w-4 h-4 text-red-500" />
  }
  return <Minus className="w-4 h-4 text-gray-400" />
}

/**
 * 核心能力诊断组件
 */
export function CompetencyDiagnosis({ 
  averageScores, 
  latestScores,
  showDetailedAnalysis = true,
  totalPracticeSessions,
  feedbackHistory = []
}: CompetencyDiagnosisProps) {
  // 默认能力评分数据，防止undefined错误
  const defaultScores: CompetencyScores = {
    内容质量: 0,
    逻辑思维: 0,
    表达能力: 0,
    创新思维: 0,
    问题分析: 0
  }
  
  // 确保averageScores不为空，并包含所有维度
  const safeAverageScores = { ...defaultScores, ...(averageScores || {}) }
  
  // 计算总体平均分
  const scoreValues = Object.values(safeAverageScores)
  const overallAverage = scoreValues.length > 0 ? scoreValues.reduce((sum, score) => sum + (score || 0), 0) / 5 : 0
  
  // 找出最强和最弱的能力
  const competencyEntries = Object.entries(safeAverageScores).map(([key, value]) => [key, value || 0]) as [keyof CompetencyScores, number][]
  
  // 确保有数据时才进行计算
  const strongestCompetency = competencyEntries.length > 0 ? competencyEntries.reduce((max, [key, value]) => 
    value > max.value ? { key, value } : max, 
    { key: competencyEntries[0][0], value: competencyEntries[0][1] }
  ) : { key: '内容质量' as keyof CompetencyScores, value: 0 }
  
  const weakestCompetency = competencyEntries.length > 0 ? competencyEntries.reduce((min, [key, value]) => 
    value < min.value ? { key, value } : min,
    { key: competencyEntries[0][0], value: competencyEntries[0][1] }
  ) : { key: '内容质量' as keyof CompetencyScores, value: 0 }

  // 控制四能力详解的展开状态
  const [showDetailedAnalysisState, setShowDetailedAnalysisState] = useState(false)
  
  // 控制四能力支柱的展开状态
  const [expandedPillars, setExpandedPillars] = useState<Record<string, boolean>>({})

  const togglePillar = (pillarId: string) => {
    setExpandedPillars(prev => ({
      ...prev,
      [pillarId]: !prev[pillarId]
    }))
  }

  return (
    <div className="space-y-6">
      {/* 标题和核心数据 */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center space-x-8">
          <h2 className="text-2xl font-bold text-gray-900">你的成长轨迹</h2>
          <div className="flex items-center space-x-2 text-lg text-gray-600">
            <Target className="h-5 w-5" />
            <span>累计练习次数: <span className="font-semibold text-blue-600">{totalPracticeSessions}</span></span>
          </div>
        </div>
        <p className="text-gray-600">基于历史练习数据的能力雷达图分析</p>
        <div className="flex items-center justify-center gap-4 mt-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{overallAverage.toFixed(1)}</div>
            <div className="text-sm text-gray-500">综合平均分</div>
          </div>
          <div className="text-center">
            <Badge variant={getCompetencyLevel(overallAverage).variant} className="text-sm">
              {getCompetencyLevel(overallAverage).label}
            </Badge>
          </div>
        </div>
      </div>

      {/* 能力雷达图和AI成长顾问 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* 能力雷达图 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>能力雷达图</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <div className="w-full max-w-md">
                <CompetencyRadar 
                  competencyScores={safeAverageScores}
                />
              </div>
            </div>
            <p className="text-sm text-gray-600 text-center mt-4">
              雷达图展示了您各项能力的综合平均表现与上次答题的对比。
            </p>
          </CardContent>
        </Card>

        {/* AI 成长顾问 */}
        <ActionableSuggestions 
          competencyData={Object.entries(safeAverageScores).map(([name, current]) => ({
            name,
            current: (current || 0) * 20, // 转换为百分制
            previous: (latestScores?.[name as keyof CompetencyScores] || 0) * 20,
            historical: (current || 0) * 20
          }))}
          lastScores={latestScores ? {
            '内容质量': latestScores.内容质量 || 0,
            '逻辑思维': latestScores.逻辑思维 || 0,
            '表达能力': latestScores.表达能力 || 0,
            '创新思维': latestScores.创新思维 || 0,
            '问题分析': latestScores.问题分析 || 0
          } : {}}
          historicalAverageScores={safeAverageScores}
        />
      </div>
      
      {/* 四能力详解 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>四能力详解</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetailedAnalysisState(!showDetailedAnalysisState)}
              className="flex items-center gap-2"
            >
              {showDetailedAnalysisState ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  收起详解
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  展开详解
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        {showDetailedAnalysisState && (
          <CardContent>
            {/* 四能力支柱详解 */}
            <div className="space-y-4">
              <Card>
                <CardHeader 
                  className="flex flex-row items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => togglePillar('pillar1')}
                >
                  <div className="flex items-center space-x-2">
                    <Brain className="w-6 h-6 text-blue-500" />
                    <CardTitle>能力支柱一：产品洞察与定义</CardTitle>
                  </div>
                  {expandedPillars['pillar1'] ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </CardHeader>
                {expandedPillars['pillar1'] && (
                <CardContent>
                  <p className="mb-4">这个支柱考察的是用户作为产品经理的基本功：能否从模糊的需求中，精准地发现问题、定义问题，并判断其价值。</p>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="border p-2 text-left">能力细分项</th>
                          <th className="border p-2 text-left">衡量标准</th>
                          <th className="border p-2 text-left">为什么重要</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border p-2">1. 用户问题挖掘</td>
                          <td className="border p-2">能否深入分析用户场景，识别并清晰定义核心痛点，而非停留在表面需求。</td>
                          <td className="border p-2">AI是用来解决问题的工具。如果连真实问题都找不到，再强的AI技术也毫无用武之地。</td>
                        </tr>
                        <tr>
                          <td className="border p-2">2. 市场格局分析</td>
                          <td className="border p-2">能否清晰阐述产品所处的市场环境、竞争格局，并找到产品的独特定位。</td>
                          <td className="border p-2">AIPM需要知道市面上已有的AI解决方案，是自己从0到1做，还是利用现有技术，或是找到差异化竞争点。</td>
                        </tr>
                        <tr>
                          <td className="border p-2">3. 业务价值判断</td>
                          <td className="border p-2">能否将产品方案与商业目标（如增长、营收、效率）清晰地联系起来，量化其潜在价值。</td>
                          <td className="border p-2">AI项目通常投入巨大，AIPM必须向公司证明其ROI（投资回报率），说服团队投入资源。</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
                )}
              </Card>
              
              <Card>
                <CardHeader 
                  className="flex flex-row items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => togglePillar('pillar2')}
                >
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="w-6 h-6 text-green-500" />
                    <CardTitle>能力支柱二：AI方案构建力</CardTitle>
                  </div>
                  {expandedPillars['pillar2'] ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </CardHeader>
                {expandedPillars['pillar2'] && (
                <CardContent>
                  <p className="mb-4">这是AIPM的硬核能力。考察用户能否将一个业务问题，转化为一个技术团队可以理解和执行的AI问题。这是替代原先"战略思维力"等模糊标签的核心。</p>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="border p-2 text-left">能力细分项</th>
                          <th className="border p-2 text-left">衡量标准</th>
                          <th className="border p-2 text-left">为什么重要</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border p-2">1. AI问题建模</td>
                          <td className="border p-2">能否准确地将用户问题，抽象成一个或多个AI任务（如分类、回归、生成、聚类等）。</td>
                          <td className="border p-2">这是AIPM与算法工程师沟通的"通用语言"。如果建模错误，整个项目方向都会错。</td>
                        </tr>
                        <tr>
                          <td className="border p-2">2. 数据策略思维</td>
                          <td className="border p-2">能否主动思考解决该问题需要什么样的数据、如何获取、如何标注、以及数据可能存在的偏差（Bias）。</td>
                          <td className="border p-2">"Garbage in, garbage out." 数据是AI的燃料，AIPM必须具备数据思维，为模型提供高质量的"口粮"。</td>
                        </tr>
                        <tr>
                          <td className="border p-2">3. 技术可行性评估</td>
                          <td className="border p-2">能否对AI方案的实现难度、边界条件和潜在风险（如模型效果不佳、延迟高等）有基本认知。</td>
                          <td className="border p-2">AIPM需要有"技术同理心"，提出务实的方案，而不是天马行空，避免给工程师"画大饼"。</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
                )}
              </Card>
              
              <Card>
                <CardHeader 
                  className="flex flex-row items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => togglePillar('pillar3')}
                >
                  <div className="flex items-center space-x-2">
                    <Briefcase className="w-6 h-6 text-yellow-500" />
                    <CardTitle>能力支柱三：逻辑与沟通表达</CardTitle>
                  </div>
                  {expandedPillars['pillar3'] ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </CardHeader>
                {expandedPillars['pillar3'] && (
                <CardContent>
                  <p className="mb-4">这个支柱考察用户能否清晰地表达自己的想法，并说服不同背景的人。这替代了原先"表达能力"的单一维度。</p>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="border p-2 text-left">能力细分项</th>
                          <th className="border p-2 text-left">衡量标准</th>
                          <th className="border p-2 text-left">为什么重要</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border p-2">1. 结构化表达</td>
                          <td className="border p-2">能否用清晰的逻辑框架（如MECE、金字塔原理）来组织和表达复杂的AI产品方案。</td>
                          <td className="border p-2">AI产品往往涉及复杂的技术和业务逻辑，AIPM必须能够化繁为简，让所有人都能理解。</td>
                        </tr>
                        <tr>
                          <td className="border p-2">2. 数据驱动论证</td>
                          <td className="border p-2">能否用数据、案例、逻辑推理来支撑自己的观点，而非仅凭直觉或经验。</td>
                          <td className="border p-2">AI时代更加注重实证和数据。AIPM的每一个决策都应该有数据支撑，这样才能获得团队信任。</td>
                        </tr>
                        <tr>
                          <td className="border p-2">3. 向上/向下/平级沟通</td>
                          <td className="border p-2">能否根据提问者的身份（模拟），调整沟通的语言和侧重点（对高管讲价值，对工程师讲实现）。</td>
                          <td className="border p-2">这是考察用户作为团队"枢纽"的潜力，能否与不同背景的同事高效协作。</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
                )}
              </Card>
              
              <Card>
                <CardHeader 
                  className="flex flex-row items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => togglePillar('pillar4')}
                >
                  <div className="flex items-center space-x-2">
                    <Globe className="w-6 h-6 text-purple-500" />
                    <CardTitle>能力支柱四：落地与迭代思维</CardTitle>
                  </div>
                  {expandedPillars['pillar4'] ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </CardHeader>
                {expandedPillars['pillar4'] && (
                <CardContent>
                  <p className="mb-4">这个支柱考察用户是否具备将想法付诸实践，并持续优化的思维。这替代了原先宽泛的"落地执行力"。</p>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="border p-2 text-left">能力细分项</th>
                          <th className="border p-2 text-left">衡量标准</th>
                          <th className="border p-2 text-left">为什么重要</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border p-2">1. MVP定义与路径规划</td>
                          <td className="border p-2">能否为产品规划一个最小可行产品（MVP），并给出后续的迭代方向和版本规划。</td>
                          <td className="border p-2">AI产品不确定性高，AIPM需要懂得小步快跑，快速验证，而不是憋一个"完美"的大招。</td>
                        </tr>
                        <tr>
                          <td className="border p-2">2. 核心指标设计</td>
                          <td className="border p-2">能否为产品设计一套合理的衡量指标，包括业务指标（如用户留存）和模型指标（如准确率）。</td>
                          <td className="border p-2">没有度量，就无法优化。AIPM必须用数据驱动产品迭代，证明产品和模型的有效性。</td>
                        </tr>
                        <tr>
                          <td className="border p-2">3. 风险识别与应对</td>
                          <td className="border p-2">能否预见到产品上线后可能遇到的问题（如用户滥用、伦理风险、效果衰退等）并提出应对策略。</td>
                          <td className="border p-2">尤其是AI产品，常常会带来意想不到的社会和伦理问题，有远见的AIPM必须提前思考这些风险。</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
                )}
              </Card>
            </div>
          </CardContent>
        )}
      </Card>

      {/* 能力优势与劣势分析 */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-green-800 flex items-center gap-2">
              <Award className="w-5 h-5" />
              最强能力
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">{strongestCompetency.key}</span>
                <Badge variant="default">{strongestCompetency.value.toFixed(1)}分</Badge>
              </div>
              <p className="text-sm text-green-700">
                这是您表现最优秀的能力维度
              </p>
              <p className="text-sm text-green-600">
                💡 继续保持这个优势，可以在面试中重点展示相关能力
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-orange-800 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              待提升能力
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">{weakestCompetency.key}</span>
                <Badge variant="outline">{weakestCompetency.value.toFixed(1)}分</Badge>
              </div>
              <p className="text-sm text-orange-700">
                这是您需要重点提升的能力维度
              </p>
              <p className="text-sm text-orange-600">
                🎯 建议重点练习这个维度，提升整体竞争力
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 各维度详细分析 */}
      {showDetailedAnalysis && (
        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="w-6 h-6 text-blue-500" />
                <span>各维度详细分析</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(COMPETENCY_INFO).map(([key, info]) => {
                  const score = safeAverageScores[key as keyof CompetencyScores] || 0
                  const level = getCompetencyLevel(score)
                  const trend = getTrendIcon(score, latestScores?.[key as keyof CompetencyScores])
                  
                  return (
                    <div key={key} className="border-l-4 border-blue-500 pl-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold flex items-center space-x-2">
                          <info.icon className={`w-5 h-5`} />
                          <span>{key}</span>
                          <span className="text-sm text-gray-500">({score.toFixed(1)}分)</span>
                          {trend}
                        </h3>
                        <Badge variant={level.variant}>
                          {level.label}
                        </Badge>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            score >= 4.5 ? 'bg-green-500' :
                            score >= 3.5 ? 'bg-blue-500' :
                            score >= 2.5 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${(score / 5) * 100}%` }}
                        />
                      </div>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {info.description}
                      </p>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default CompetencyDiagnosis

/**
 * 计算指定能力在最近几次练习中的得分趋势
 * @param history 练习历史
 * @param competency 能力维度
 * @returns 分数变化趋势
 */
const getTrend = (history: any[], competency: keyof CompetencyScores): number => {
  if (history.length < 2) {
    return 0
  }
  const recentSessions = history.slice(-5) // 分析最近5次
  if (recentSessions.length < 2) {
    return 0
  }

  const latestSession = recentSessions[recentSessions.length - 1]
  const previousSession = recentSessions[0]

  // 使用可选链安全地访问深层嵌套的属性
  const latestScore = latestSession?.evaluation?.competencyScores?.[competency]
  const previousScore = previousSession?.evaluation?.competencyScores?.[competency]
  
  if (typeof latestScore === 'number' && typeof previousScore === 'number') {
    return latestScore - previousScore
  }
  return 0
}