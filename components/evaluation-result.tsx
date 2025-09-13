import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, CheckCircle, Target, TrendingUp } from "lucide-react"

interface EvaluationResultProps {
  result: {
    overallScore: number
    coreCompetencyScores: {
      productThinking: number
      technicalUnderstanding: number
      projectManagement: number
      businessAcumen: number
    }
    performanceScores: {
      communication: number
      logicalStructure: number
      confidence: number
      adaptability: number
    }
    rating: string
    summary: string
    aiDiagnosis: string // New coaching fields
    coachGuidance: string
    highlights: Array<{
      tag: string
      description: string
    }>
    improvements: Array<{
      tag: string
      description: string
    }>
    strategicSuggestions: Array<{
      tag: string
      suggestion: string
      example: string
    }>
  }
}

export function EvaluationResult({ result }: EvaluationResultProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-green-500"
    if (score >= 60) return "bg-yellow-500"
    return "bg-red-500"
  }

  return (
    <div className="space-y-6">
      {/* Overall Assessment */}
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">能力分析报告</CardTitle>
          <Badge variant="outline" className="text-lg px-4 py-1">
            {result.rating}
          </Badge>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">{result.summary}</p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />🎯 问题诊断
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-red-800 font-medium">{result.aiDiagnosis}</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <Target className="h-5 w-5" />🚀 立即改进
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-green-800 font-medium">{result.coachGuidance}</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis */}
      <Tabs defaultValue="core" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="core">核心能力</TabsTrigger>
          <TabsTrigger value="performance">综合表现</TabsTrigger>
          <TabsTrigger value="highlights">亮点分析</TabsTrigger>
          <TabsTrigger value="improvements">改进建议</TabsTrigger>
        </TabsList>

        <TabsContent value="core" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>核心能力评估</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(result.coreCompetencyScores).map(([key, score]) => {
                const labels = {
                  productThinking: "产品思维",
                  technicalUnderstanding: "技术理解",
                  projectManagement: "项目管理",
                  businessAcumen: "商业化能力",
                }
                return (
                  <div key={key} className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">{labels[key as keyof typeof labels]}</span>
                      <span className={`text-sm font-bold ${getScoreColor(score * 10)}`}>{score}/10</span>
                    </div>
                    <Progress value={score * 10} className="h-2" />
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>综合表现评估</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(result.performanceScores).map(([key, score]) => {
                const labels = {
                  communication: "沟通表达",
                  logicalStructure: "逻辑结构",
                  confidence: "自信度",
                  adaptability: "临场反应",
                }
                return (
                  <div key={key} className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">{labels[key as keyof typeof labels]}</span>
                      <span className={`text-sm font-bold ${getScoreColor(score * 10)}`}>{score}/10</span>
                    </div>
                    <Progress value={score * 10} className="h-2" />
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="highlights" className="space-y-4">
          {result.highlights.map((highlight, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />✨ {highlight.tag}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{highlight.description}</p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="improvements" className="space-y-4">
          {result.improvements.map((improvement, index) => (
            <Card key={index} className="border-l-2 border-l-orange-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-700">
                  <TrendingUp className="h-5 w-5" />🔧 {improvement.tag}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed font-medium">{improvement.description}</p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}
