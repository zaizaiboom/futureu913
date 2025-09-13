'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Zap } from "lucide-react"

const features = [
  {
    title: "个性化反馈与解析",
    description: "针对你的回答给出精准点评，并提供详细的答案解析和优化建议。",
  },
  {
    title: "面试历史总结",
    description: "你的所有练习记录都将永久保存，形成专属“学习报告”。AI将为你总结不足，分析进步空间，让你清晰地看到自己的成长轨迹。",
  },
  {
    title: "持续提升方案",
    description: "系统会根据你的表现，智能推荐后续的练习重点和提升方向，确保你的每一次努力都更有效。",
  },
]

export default function CoreFeatures() {
  return (
    <section id="core-features" className="py-20 w-full bg-white/80 backdrop-blur-sm">
      <div className="w-full px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center">
            <Zap className="w-8 h-8 mr-3 text-purple-600" />
            不止于答题，更是一场深度自我修炼
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            在FutureU，你的每一次作答都将得到专业的AI智能反馈。系统会根据你的回答内容，为你提供：
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="bg-white/60 backdrop-blur-lg shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/50">
              <CardHeader>
                <CardTitle className="flex items-center text-xl font-semibold text-gray-900">
                  <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}