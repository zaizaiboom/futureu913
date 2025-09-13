'use client'

import { BookOpen, Target, Star, BrainCircuit, LineChart, ClipboardCheck } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const steps = [
  {
    icon: BrainCircuit,
    title: '选择训练模块',
    description: '从HR面试、专业面试和终面中选择一个模块开始你的训练。',
  },
  {
    icon: ClipboardCheck,
    title: '进行模拟面试',
    description: '与AI进行真实的面试模拟，回答针对性问题。',
  },
  {
    icon: LineChart,
    title: '获取智能反馈',
    description: '完成面试后，获得详细的AI评估报告和学习建议。',
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 w-full bg-white">
      <div className="w-full px-4">
        <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">它能为我带来什么价值</h2>
        <div className="relative">
          {/* Timeline line */}
          <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -translate-y-1/2"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 relative">
            {steps.map((step, index) => {
              const Icon = step.icon
              return (
                <div key={index} className="flex flex-col items-center text-center">
                  <div className="relative mb-6">
                    <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                      <Icon className="w-10 h-10 text-white" />
                    </div>
                    {/* Timeline connector for mobile */}
                    {index < steps.length - 1 && (
                      <div className="md:hidden absolute top-full left-1/2 w-0.5 h-16 bg-gray-200 mt-2"></div>
                    )}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-600 max-w-xs">{step.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}