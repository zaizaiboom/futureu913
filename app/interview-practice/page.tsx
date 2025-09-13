"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Target, Brain, TrendingUp, ArrowLeft } from "lucide-react"
import InterviewPractice from "../../interview-practice"

// 强制动态渲染
export const dynamic = 'force-dynamic'

function InterviewPracticeContent({ moduleType, setModuleType }: {
  moduleType: "hr" | "professional" | "final";
  setModuleType: (moduleType: "hr" | "professional" | "final") => void;
}) {
  const [showFocusMode, setShowFocusMode] = useState(false)
  const [focusType, setFocusType] = useState<string | null>(null)
  const [showSuggestion, setShowSuggestion] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  
  useEffect(() => {
    const focus = searchParams.get('focus')
    const module = searchParams.get('module')
    
    if (focus) {
      setFocusType(focus)
      setShowFocusMode(true)
    }
    
    // 从URL参数中设置面试模块类型
    if (module && (module === 'hr' || module === 'professional' || module === 'final')) {
      setModuleType(module)
    }
  }, [searchParams, setModuleType])
  
  const handleBack = () => {
    if (showFocusMode) {
      setShowFocusMode(false)
      setFocusType(null)
    } else {
      router.push("/")
    }
  }
  
  const handleStartFocusPractice = () => {
    setShowFocusMode(false)
  }
  
  const getFocusConfig = (focus: string) => {
    switch (focus) {
      case 'core':
        return {
          title: '核心能力专项练习',
          description: '针对您的核心提升方向进行专项训练',
          icon: Target,
          color: 'blue',
          recommendedModule: 'professional',
          tips: [
            '重点关注产品思维和逻辑表达',
            '结合具体案例进行回答',
            '注意回答的结构化和条理性'
          ]
        }
      case 'frequent':
        return {
          title: '重点关注领域练习',
          description: '针对您最需要改进的能力领域进行强化训练',
          icon: Brain,
          color: 'amber',
          recommendedModule: 'hr',
          tips: [
            '加强基础概念的理解',
            '多练习表达的流畅性',
            '注意回答的完整性和准确性'
          ]
        }
      case 'strength':
        return {
          title: '优势巩固练习',
          description: '巩固您的优势能力，保持良好表现',
          icon: TrendingUp,
          color: 'green',
          recommendedModule: 'final',
          tips: [
            '继续发挥您的优势',
            '尝试更高难度的挑战',
            '保持稳定的表现水平'
          ]
        }
      default:
        return {
          title: '专项练习',
          description: '针对性练习',
          icon: Target,
          color: 'blue',
          recommendedModule: 'hr',
          tips: ['专注练习，持续提升']
        }
    }
  }
  
  if (showFocusMode && focusType) {
    const config = getFocusConfig(focusType)
    const IconComponent = config.icon
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-purple-50 p-4">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-6">
            <Button 
              variant="ghost" 
              onClick={handleBack}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回学习报告
            </Button>
            
            <Card className="border-2 border-dashed border-gray-200">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className={`p-3 rounded-full bg-${config.color}-100`}>
                    <IconComponent className={`h-6 w-6 text-${config.color}-600`} />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{config.title}</CardTitle>
                    <p className="text-gray-600 mt-1">{config.description}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">推荐练习模块</h4>
                    <Badge variant="outline" className={`bg-${config.color}-50 text-${config.color}-700`}>
                      {config.recommendedModule === 'hr' ? 'HR面试' : 
                       config.recommendedModule === 'professional' ? '专业面试' : '终面'}
                    </Badge>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">练习建议</h4>
                    <ul className="space-y-1">
                      {config.tips.map((tip, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-start">
                          <span className="text-gray-400 mr-2">•</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <Button 
                      onClick={() => {
                        setModuleType(config.recommendedModule as "hr" | "professional" | "final")
                        setShowSuggestion(true)
                        handleStartFocusPractice()
                      }}
                      className={`w-full bg-${config.color}-600 hover:bg-${config.color}-700`}
                    >
                      开始专项练习
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <InterviewPractice 
      moduleType={moduleType} 
      setModuleType={setModuleType}
      onBack={handleBack} 
      showSuggestion={showSuggestion}
      setShowSuggestion={setShowSuggestion}
    />
  )
}

export default function InterviewPracticePage() {
  const [moduleType, setModuleType] = useState<"hr" | "professional" | "final">("hr");

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">正在加载面试练习...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <InterviewPracticeContent moduleType={moduleType} setModuleType={setModuleType} />
    </Suspense>
  )
}
