import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Briefcase, Target, Clock, BookOpen, TrendingUp } from "lucide-react"

export default function InterviewModules() {
  const modules = [
    {
      id: 1,
      title: "HR面试",
      subtitle: "模块一",
      description: "考察求职动机、软技能和个人素质",
      icon: Users,
      color: "bg-blue-500",
      features: ["自我介绍技巧", "职业规划问题", "团队协作能力", "沟通表达能力", "抗压能力评估"],
      duration: "30-45分钟",
      difficulty: "基础",
      questionCount: "15-20题",
    },
    {
      id: 2,
      title: "专业面试",
      subtitle: "模块二",
      description: "考察产品能力、行业理解和专业技能",
      icon: Briefcase,
      color: "bg-green-500",
      features: ["产品思维训练", "行业分析能力", "专业知识考察", "项目经验分享", "解决方案设计"],
      duration: "45-60分钟",
      difficulty: "进阶",
      questionCount: "20-25题",
    },
    {
      id: 3,
      title: "终面",
      subtitle: "模块三",
      description: "考察宏观思维、案例分析和领导潜质",
      icon: Target,
      color: "bg-purple-500",
      features: ["战略思维能力", "复杂案例分析", "领导力评估", "创新思维训练", "商业敏感度"],
      duration: "60-90分钟",
      difficulty: "高级",
      questionCount: "10-15题",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">模拟面试系统</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">选择适合的面试模块，提升您的面试技能和职场竞争力</p>
        </div>

        {/* Module Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {modules.map((module) => {
            const IconComponent = module.icon
            return (
              <Card
                key={module.id}
                className="relative overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                {/* Color accent */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${module.color}`} />

                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary" className="text-xs">
                      {module.subtitle}
                    </Badge>
                    <div className={`p-2 rounded-lg ${module.color} bg-opacity-10`}>
                      <IconComponent
                        className={`w-6 h-6 text-white`}
                        style={{ color: module.color.replace("bg-", "").replace("-500", "") }}
                      />
                    </div>
                  </div>
                  <CardTitle className="text-xl font-bold">{module.title}</CardTitle>
                  <CardDescription className="text-sm text-gray-600">{module.description}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <Clock className="w-4 h-4 mx-auto mb-1 text-gray-500" />
                      <p className="text-xs text-gray-600">{module.duration}</p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <BookOpen className="w-4 h-4 mx-auto mb-1 text-gray-500" />
                      <p className="text-xs text-gray-600">{module.questionCount}</p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <TrendingUp className="w-4 h-4 mx-auto mb-1 text-gray-500" />
                      <p className="text-xs text-gray-600">{module.difficulty}</p>
                    </div>
                  </div>

                  {/* Features */}
                  <div>
                    <h4 className="font-semibold text-sm mb-2 text-gray-700">考察重点：</h4>
                    <ul className="space-y-1">
                      {module.features.slice(0, 3).map((feature, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-center">
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2" />
                          {feature}
                        </li>
                      ))}
                      {module.features.length > 3 && (
                        <li className="text-sm text-gray-500">+{module.features.length - 3} 更多考察点</li>
                      )}
                    </ul>
                  </div>
                </CardContent>

                <CardFooter className="pt-4">
                  <div className="w-full space-y-2">
                    <Button className="w-full" size="lg">
                      开始练习
                    </Button>
                    <Button variant="outline" className="w-full bg-transparent" size="sm">
                      查看详情
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            )
          })}
        </div>

        {/* Additional Info */}
        <div className="bg-white rounded-xl p-8 shadow-sm border">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">智能题库</h3>
              <p className="text-sm text-gray-600">基于真实面试场景，涵盖各行业常见问题</p>
            </div>
            <div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Target className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">个性化训练</h3>
              <p className="text-sm text-gray-600">根据您的表现调整难度，针对性提升</p>
            </div>
            <div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">实时反馈</h3>
              <p className="text-sm text-gray-600">即时获得专业评价和改进建议</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
