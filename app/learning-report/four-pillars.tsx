'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Brain, MessageSquare, Briefcase, Globe, ChevronDown, ChevronUp } from 'lucide-react'

interface FourPillarsProps {
  abilities: string[]
  scores: number[]
}

export default function FourPillars({ abilities, scores }: FourPillarsProps) {
  const [expandedPillars, setExpandedPillars] = useState<Record<string, boolean>>({});

  const togglePillar = (pillarId: string) => {
    setExpandedPillars(prev => ({
      ...prev,
      [pillarId]: !prev[pillarId]
    }));
  };

  return (
    <div className="space-y-6">
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
          <p>这个支柱考察的是用户作为产品经理的基本功：能否从模糊的需求中，精准地发现问题、定义问题，并判断其价值。</p>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border p-2">能力细分项</th>
                <th className="border p-2">衡量标准</th>
                <th className="border p-2">为什么重要</th>
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
          <p>这是AIPM的硬核能力。考察用户能否将一个业务问题，转化为一个技术团队可以理解和执行的AI问题。这是替代原先“战略思维力”等模糊标签的核心。</p>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border p-2">能力细分项</th>
                <th className="border p-2">衡量标准</th>
                <th className="border p-2">为什么重要</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border p-2">1. AI问题建模</td>
                <td className="border p-2">能否准确地将用户问题，抽象成一个或多个AI任务（如分类、回归、生成、聚类等）。</td>
                <td className="border p-2">这是AIPM与算法工程师沟通的“通用语言”。如果建模错误，整个项目方向都会错。</td>
              </tr>
              <tr>
                <td className="border p-2">2. 数据策略思维</td>
                <td className="border p-2">能否主动思考解决该问题需要什么样的数据、如何获取、如何标注、以及数据可能存在的偏差（Bias）。</td>
                <td className="border p-2">“Garbage in, garbage out.” 数据是AI的燃料，AIPM必须具备数据思维，为模型提供高质量的“口粮”。</td>
              </tr>
              <tr>
                <td className="border p-2">3. 技术可行性评估</td>
                <td className="border p-2">能否对AI方案的实现难度、边界条件和潜在风险（如模型效果不佳、延迟高等）有基本认知。</td>
                <td className="border p-2">AIPM需要有“技术同理心”，提出务实的方案，而不是天马行空，避免给工程师“画大饼”。</td>
              </tr>
            </tbody>
          </table>
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
          <p>这个支柱考察用户在面试中传递信息的能力。无论想法多好，说不清楚等于零。</p>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border p-2">能力细分项</th>
                <th className="border p-2">衡量标准</th>
                <th className="border p-2">为什么重要</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border p-2">1. 结构化表达</td>
                <td className="border p-2">回答问题是否条理清晰，能否运用总分总、STAR法则等框架，让面试官轻松跟上思路。</td>
                <td className="border p-2">AIPM需要向CEO、工程师、运营等不同角色汇报方案，结构化的表达能保证信息高效、准确地传递。</td>
              </tr>
              <tr>
                <td className="border p-2">2. 关键信息提炼</td>
                <td className="border p-2">能否在有限时间内，精准地传达核心观点和方案亮点，而不是信息堆砌、长篇大论。</td>
                <td className="border p-2">在快节奏的工作中，抓住重点是一种核心能力。能用三句话讲清，就不用三十句。</td>
              </tr>
              <tr>
                <td className="border p-2">3. 向上/向下/平级沟通</td>
                <td className="border p-2">能否根据提问者的身份（模拟），调整沟通的语言和侧重点（对高管讲价值，对工程师讲实现）。</td>
                <td className="border p-2">这是考察用户作为团队“枢纽”的潜力，能否与不同背景的同事高效协作。</td>
              </tr>
            </tbody>
          </table>
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
          <p>这个支柱考察用户是否具备将想法付诸实践，并持续优化的思维。这替代了原先宽泛的“落地执行力”。</p>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border p-2">能力细分项</th>
                <th className="border p-2">衡量标准</th>
                <th className="border p-2">为什么重要</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border p-2">1. MVP定义与路径规划</td>
                <td className="border p-2">能否为产品规划一个最小可行产品（MVP），并给出后续的迭代方向和版本规划。</td>
                <td className="border p-2">AI产品不确定性高，AIPM需要懂得小步快跑，快速验证，而不是憋一个“完美”的大招。</td>
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
        </CardContent>
        )}
      </Card>
    </div>
  )
}

