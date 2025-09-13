'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { Button } from '@/components/ui/button'

interface ActionHandbookProps {
  improvementArea: string
  recommendedArticle: string
  practiceQuestion: string
  thinkingTool: string
}

export default function ActionHandbook({ improvementArea, recommendedArticle, practiceQuestion, thinkingTool }: ActionHandbookProps) {
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>今日行动手册</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-lg">改进建议</h3>
            <p>根据您的四个能力分析，以下是针对性改进建议：</p>
            <ul className="list-disc pl-5">
              <li>产品洞察与定义：加强用户问题挖掘，通过更多市场调研提升。</li>
              <li>AI方案构建力：练习AI问题建模，学习相关数据策略。</li>
              <li>逻辑与沟通表达：改善结构化表达，练习关键信息提炼。</li>
              <li>落地与迭代思维：聚焦MVP规划和风险识别。</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-lg">知识学习</h3>
            <p>推荐学习资源（基于能力分析）：</p>
            <ul className="list-disc pl-5">
              <li>产品经理基础：阅读《Inspired》书籍。</li>
              <li>AI相关：Coursera的AI for Everyone课程。</li>
              <li>沟通技能：观看TED演讲技巧视频。</li>
              <li>迭代思维：学习敏捷开发方法论。</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}