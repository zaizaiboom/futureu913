'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Lightbulb, Book } from "lucide-react"

interface CompetencyData {
  name: string
  current: number
  previous: number
  historical: number
}

interface ActionableSuggestionsProps {
  competencyData: CompetencyData[]
  lastScores: { [key: string]: number }
  historicalAverageScores: { [key: string]: number }
}

interface Suggestion {
  title: string;
  description: string;
  type: string;
}

// Function to generate suggestions based on competency data
const generateSuggestions = (competencyData: CompetencyData[]) => {
  const suggestions = []

  // 基于能力表现趋势分析，而非具体分数
  const needsImprovement = competencyData
    .filter(c => c.current < c.previous || c.current < c.historical)
    .sort((a, b) => (a.current - a.previous) - (b.current - b.previous))

  const showingStrength = competencyData
    .filter(c => c.current > c.previous && c.current > c.historical)
    .sort((a, b) => (b.current - b.previous) - (a.current - a.previous))

  const stablePerformers = competencyData
    .filter(c => Math.abs(c.current - c.previous) <= 5)

  if (needsImprovement.length > 0) {
    suggestions.push({
      title: `核心提升方向: ${needsImprovement[0].name}`,
      description: `您在"${needsImprovement[0].name}"方面还有提升空间。建议重点关注相关练习，通过结构化思考和案例分析来改善表现。`,
      type: "improvement",
    })
  }

  if (showingStrength.length > 0) {
    suggestions.push({
      title: `保持优势: ${showingStrength[0].name}`,
      description: `您在"${showingStrength[0].name}"方面表现优秀且持续进步，请继续保持，并尝试在更多场景下应用该能力。`,
      type: "strength",
    })
  }

  if (stablePerformers.length === competencyData.length) {
    suggestions.push({
      title: "综合表现稳定",
      description: "您的各项能力表现稳定，建议在保持现有水平的基础上，选择一到两个重点方向进行突破。",
      type: "info",
    })
  }

  return suggestions
}

const recommendedResources = [
  {
    title: "结构化思维导论",
    description: "学习如何系统性地分析问题。",
    link: "#",
  },
  {
    title: "高效沟通技巧",
    description: "提升您的表达能力和说服力。",
    link: "#",
  },
]

export function ActionableSuggestions({ competencyData, lastScores, historicalAverageScores }: ActionableSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('[ActionableSuggestions] useEffect triggered. competencyData:', competencyData);
    const fetchSuggestions = async () => {
      console.log('[ActionableSuggestions] fetchSuggestions called.');
      if (!competencyData || competencyData.length === 0) {
        console.log('[ActionableSuggestions] competencyData is empty, skipping fetch.');
        setLoading(false)
        return
      }

      console.log('[ActionableSuggestions] Fetching suggestions...');
      try {
        const response = await fetch('/api/generate-suggestions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ competencyData }),
        })

        if (!response.ok) {
          throw new Error('Failed to fetch suggestions')
        }

        const data = await response.json()
        setSuggestions(data.suggestions)
      } catch (err) {
        console.error("API call failed, using local fallback:", err)
        const localSuggestions = generateSuggestions(competencyData)
        setSuggestions(localSuggestions)
      } finally {
        setLoading(false)
      }
    }

    fetchSuggestions()
  }, [competencyData])

  if (loading) {
    return (
      <Card className="bg-white dark:bg-gray-950 rounded-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lightbulb className="w-6 h-6 mr-3 text-yellow-500" />
            <span className="text-lg font-semibold text-gray-800 dark:text-gray-200">AI 综合成长建议</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 dark:text-gray-400">正在生成建议...</p>
        </CardContent>
      </Card>
    )
  }

  const suggestionTypeStyles = {
    improvement: {
      bg: "bg-blue-50 dark:bg-blue-900/50",
      text: "text-blue-800 dark:text-blue-300",
      description: "text-blue-700 dark:text-blue-400",
    },
    strength: {
      bg: "bg-green-50 dark:bg-green-900/50",
      text: "text-green-800 dark:text-green-300",
      description: "text-green-700 dark:text-green-400",
    },
    info: {
      bg: "bg-gray-50 dark:bg-gray-800/50",
      text: "text-gray-800 dark:text-gray-300",
      description: "text-gray-700 dark:text-gray-400",
    },
  }

  return (
    <Card className="bg-white dark:bg-gray-950 rounded-2xl shadow-lg border-0">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Lightbulb className="w-6 h-6 mr-3 text-yellow-500" />
          <span className="text-lg font-semibold text-gray-800 dark:text-gray-200">AI 综合成长建议</span>
        </CardTitle>
        <p className="text-gray-600 text-sm mt-1">基于您的能力表现提供个性化建议</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {suggestions.map((suggestion, index) => {
          const styles = suggestionTypeStyles[suggestion.type as keyof typeof suggestionTypeStyles]
          return (
            <div key={index} className={`p-4 rounded-lg ${styles.bg}`}>
              <h4 className={`font-semibold mb-1 ${styles.text}`}>{suggestion.title}</h4>
              <p className={`text-sm ${styles.description}`}>{suggestion.description}</p>
            </div>
          )
        })}
        
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center">
            <Book className="w-5 h-5 mr-2 text-purple-500" />
            推荐学习资源
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {recommendedResources.map((resource, index) => (
              <div
                key={index}
                className="block p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
              >
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">{resource.title}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{resource.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}