'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ThumbsUp, AlertTriangle, Star, Target } from 'lucide-react'

interface Highlight {
  title: string
  description: string
  category: string
}

interface Improvement {
  title: string
  description: string
  actionSuggestion: string
  priority: 'high' | 'medium' | 'low'
}

interface HighlightsImprovementsProps {
  highlights?: Highlight[]
  improvements?: Improvement[]
}

// 模拟数据
const defaultHighlights: Highlight[] = [
  {
    title: '战略思维显著提升',
    description: '在最近的练习中，你开始主动分析市场环境和竞争态势，展现出更全面的商业思维。',
    category: '思维能力'
  },
  {
    title: '数据分析能力突出',
    description: '能够准确解读数据指标，并基于数据提出合理的业务建议，逻辑清晰。',
    category: '分析能力'
  },
  {
    title: '学习适应性强',
    description: '快速掌握新概念和框架，并能灵活运用到实际场景中，学习效率很高。',
    category: '学习能力'
  },
  {
    title: '创新思维活跃',
    description: '提出了多个创新性的解决方案，思维发散，敢于突破常规思路。',
    category: '创新能力'
  }
]

const defaultImprovements: Improvement[] = [
  {
    title: '表达逻辑需要优化',
    description: '回答时偶尔出现逻辑跳跃，建议先梳理思路再表达。',
    actionSuggestion: '练习使用"首先、其次、最后"等逻辑词，建立清晰的表达框架。',
    priority: 'high'
  },
  {
    title: '细节关注度有待提升',
    description: '在分析问题时容易忽略一些重要细节，影响方案的完整性。',
    actionSuggestion: '建立检查清单，确保考虑到所有关键要素。',
    priority: 'medium'
  },
  {
    title: '时间管理需要改进',
    description: '部分练习题回答时间较长，需要提高答题效率。',
    actionSuggestion: '设定时间限制，练习在规定时间内完成回答。',
    priority: 'medium'
  }
]

export function HighlightsImprovements({ 
  highlights = defaultHighlights,
  improvements = defaultImprovements 
}: HighlightsImprovementsProps) {
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high':
        return '高优先级'
      case 'medium':
        return '中优先级'
      case 'low':
        return '低优先级'
      default:
        return '普通'
    }
  }

  return (
    <Card className="shadow-lg border-0 bg-white">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
          <span className="text-2xl">⭐</span>
          亮点与待提升
        </CardTitle>
        <p className="text-gray-600 text-sm">基于最近表现的优势总结与改进建议</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 今日亮点 */}
          <div className="highlight-card rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <ThumbsUp className="h-6 w-6 text-green-600" />
              <h3 className="text-lg font-semibold text-green-800">今日亮点</h3>
            </div>
            <div className="space-y-3">
              {highlights.map((highlight, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <Star className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-green-700">
                    <span className="font-medium">{highlight.category}：</span>
                    {highlight.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 重点提升 */}
          <div className="improvement-card rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
              <h3 className="text-lg font-semibold text-yellow-800">重点提升</h3>
            </div>
            <div className="space-y-4">
              {improvements.map((improvement, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-yellow-700 font-medium">{improvement.title}</p>
                  </div>
                  <div className="ml-6">
                    <p className="text-xs text-yellow-600 mb-2">{improvement.description}</p>
                    <p className="text-xs text-gray-600">
                      <span className="font-medium">建议：</span>{improvement.actionSuggestion}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}