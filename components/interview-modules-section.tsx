'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Briefcase, Target, CheckCircle, Play, Clock, BarChart3 } from "lucide-react"

const modules = [
  {
    id: 1,
    key: "hr" as const,
    title: "HR面试",
    subtitle: "模块一",
    description: "考察AI PM求职动机、软技能和个人素质",
    icon: Users,
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-50",
    textColor: "text-blue-600",
    features: ["自我介绍与职业规划", "为什么选择AI PM", "团队协作经验", "沟通表达能力", "抗压能力评估"],
    duration: "30-45分钟",
    difficulty: "基础",
  },
  {
    id: 2,
    key: "professional" as const,
    title: "专业面试",
    subtitle: "模块二",
    description: "考察AI产品能力、技术理解和行业认知",
    icon: Briefcase,
    color: "from-green-500 to-green-600",
    bgColor: "bg-green-50",
    textColor: "text-green-600",
    features: ["AI产品设计思维", "技术与商业平衡", "用户需求分析", "竞品分析能力", "数据驱动决策"],
    duration: "45-60分钟",
    difficulty: "进阶",
  },
  {
    id: 3,
    key: "final" as const,
    title: "终面",
    subtitle: "模块三",
    description: "考察AI行业洞察、战略思维和领导潜质",
    icon: Target,
    color: "from-purple-500 to-purple-600",
    bgColor: "bg-purple-50",
    textColor: "text-purple-600",
    features: ["AI行业趋势判断", "复杂场景分析", "商业模式设计", "团队管理能力", "创新思维展示"],
    duration: "60-90分钟",
    difficulty: "高级",
  },
]

interface InterviewModulesSectionProps {
  onStartPractice: (module: "hr" | "professional" | "final") => void;
}

export default function InterviewModulesSection({ onStartPractice }: InterviewModulesSectionProps) {
  return (
    <section id="interview-modules" className="py-12 sm:py-16 lg:py-20 w-full">
      <div className="text-center mb-8 sm:mb-12">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">三大核心训练模块</h2>
        <p className="text-base sm:text-lg text-gray-600 mt-2">从基础到高级, 全方位提升您的AI产品经理面试能力</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 w-full px-4">
        {modules.map((module) => {
          const IconComponent = module.icon
          return (
            <Card key={module.id} className={`overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300 flex flex-col ${module.bgColor}`}>
              <CardContent className="p-4 sm:p-6 lg:p-8 flex flex-col flex-grow">
                <div className="flex justify-end">
                  <Badge variant="secondary" className={`${module.textColor} bg-white/80 text-xs sm:text-sm`}>
                    {module.subtitle}
                  </Badge>
                </div>
                
                <div className="flex flex-col items-center text-center my-3 sm:my-4">
                  <div className={`p-2 sm:p-3 rounded-xl bg-gradient-to-r ${module.color} mb-3 sm:mb-4`}>
                    <IconComponent className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900">{module.title}</h3>
                </div>

                <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 text-center">{module.description}</p>

                <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-4 sm:mb-6 text-center">
                  <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                    <span className="text-xs sm:text-sm font-semibold">{module.duration}</span>
                  </div>
                  <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                    <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                    <span className="text-xs sm:text-sm font-semibold">{module.difficulty}</span>
                  </div>
                </div>

                <div className="mb-4 sm:mb-6">
                     <h4 className="font-semibold text-xs sm:text-sm mb-2 sm:mb-3 text-gray-700">核心能力训练：</h4>
                     <div className="space-y-1 sm:space-y-2">
                       {module.features.map((feature, idx) => (
                         <div key={idx} className="flex items-center text-xs sm:text-sm text-gray-600">
                           <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-1 sm:mr-2 flex-shrink-0" />
                           {feature}
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={() => onStartPractice(module.key)}
                  className={`w-full bg-gradient-to-r ${module.color} hover:shadow-lg transition-all duration-300 mt-auto text-sm sm:text-base`}
                  size="lg"
                >
                  <Play className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  开始训练
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </section>
  )
}