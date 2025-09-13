import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, Clock, Target, TrendingUp, Star, Award } from "lucide-react"

interface ProgressData {
  stage: string
  completedQuestions: number
  totalQuestions: number
  averageScore: number
  lastPracticeDate: string
  improvementAreas: string[]
  strengths: string[]
}

interface ProgressTrackerProps {
  progressData: ProgressData[]
  overallCompletion: number
  currentStreak: number
  totalPracticeHours: number
}

export default function ProgressTracker({
  progressData,
  overallCompletion,
  currentStreak,
  totalPracticeHours,
}: ProgressTrackerProps) {
  const getStageIcon = (stage: string) => {
    switch (stage) {
      case "hr":
        return <CheckCircle className="w-5 h-5 text-blue-600" />
      case "professional":
        return <Target className="w-5 h-5 text-green-600" />
      case "final":
        return <Award className="w-5 h-5 text-purple-600" />
      default:
        return <Clock className="w-5 h-5 text-gray-600" />
    }
  }

  const getStageTitle = (stage: string) => {
    switch (stage) {
      case "hr":
        return "HR面试"
      case "professional":
        return "专业面试"
      case "final":
        return "终面"
      default:
        return stage
    }
  }

  const getScoreLevel = (score: number) => {
    if (score >= 90) return { level: "导演级", color: "text-purple-600 bg-purple-100" }
    if (score >= 80) return { level: "制片级", color: "text-green-600 bg-green-100" }
    if (score >= 70) return { level: "编剧级", color: "text-blue-600 bg-blue-100" }
    if (score >= 60) return { level: "助理级", color: "text-yellow-600 bg-yellow-100" }
    return { level: "实习级", color: "text-gray-600 bg-gray-100" }
  }

  return (
    <div className="space-y-6">
      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">总体完成度</p>
                <p className="text-2xl font-bold text-blue-800">{overallCompletion}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">连续练习</p>
                <p className="text-2xl font-bold text-green-800">{currentStreak}天</p>
              </div>
              <Star className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">练习时长</p>
                <p className="text-2xl font-bold text-purple-800">{totalPracticeHours}h</p>
              </div>
              <Clock className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stage Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5" />
            <span>各阶段进度</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {progressData.map((stage, index) => {
            const completion = (stage.completedQuestions / stage.totalQuestions) * 100
            const scoreLevel = getScoreLevel(stage.averageScore)

            return (
              <div key={index} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStageIcon(stage.stage)}
                    <div>
                      <h4 className="font-semibold">{getStageTitle(stage.stage)}</h4>
                      <p className="text-sm text-gray-600">
                        {stage.completedQuestions}/{stage.totalQuestions} 题完成
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={scoreLevel.color}>{scoreLevel.level}</Badge>
                    <p className="text-sm text-gray-600 mt-1">平均分: {stage.averageScore}</p>
                  </div>
                </div>

                <Progress value={completion} className="h-2" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-green-700 mb-1">优势能力:</p>
                    <div className="flex flex-wrap gap-1">
                      {stage.strengths.slice(0, 3).map((strength, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs bg-green-100 text-green-700">
                          {strength}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-orange-700 mb-1">提升重点:</p>
                    <div className="flex flex-wrap gap-1">
                      {stage.improvementAreas.slice(0, 3).map((area, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs bg-orange-100 text-orange-700">
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Growth Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>成长时间轴</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {progressData.map((stage, index) => (
              <div key={index} className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{index + 1}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{getStageTitle(stage.stage)}</h4>
                    <span className="text-sm text-gray-500">{stage.lastPracticeDate}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    从实习级成长到{getScoreLevel(stage.averageScore).level}，完成了{stage.completedQuestions}
                    道题目的练习
                  </p>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      {Math.round((stage.completedQuestions / stage.totalQuestions) * 100)}% 完成
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      平均分 {stage.averageScore}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
