'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Lightbulb, BookOpen } from "lucide-react"

const tips = [
  {
    title: "准备充分",
    description: "在开始练习前，确保您的设备音频正常，环境安静",
    icon: CheckCircle
  },
  {
    title: "真实表达",
    description: "像真实面试一样回答问题，这样AI评估会更加准确",
    icon: Lightbulb
  },
  {
    title: "反复练习",
    description: "多次练习同一模块，观察自己的进步和改善",
    icon: BookOpen
  }
]

export default function QuickTips() {
  return (
    <section id="quick-tips" className="py-20 w-full bg-gray-50/80 backdrop-blur-sm">
      <div className="w-full px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">快速上手技巧</h2>
          <p className="text-lg text-gray-600 mt-2">最大化您的训练效果</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {tips.map((tip, index) => {
            const IconComponent = tip.icon
            return (
              <Card key={index} className="bg-white/70 backdrop-blur-lg shadow-md hover:shadow-lg transition-all duration-300">
                <CardHeader className="flex flex-row items-center space-x-4 pb-4">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <IconComponent className="w-6 h-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-gray-800">{tip.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{tip.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
