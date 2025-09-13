'use client'

import { useState, useEffect } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface DiagnosisProps {
  answer: string
  highlights: { text: string; type: 'strength' | 'improvement'; suggestion?: string }[]
}

export default function IntelligentDiagnosis({ answer, highlights }: DiagnosisProps) {
  const [markedAnswer, setMarkedAnswer] = useState<React.ReactNode[]>([])

  useEffect(() => {
    const parts = []
    let lastIndex = 0

    highlights.sort((a, b) => answer.indexOf(a.text) - answer.indexOf(b.text))

    highlights.forEach((hl) => {
      const start = answer.indexOf(hl.text, lastIndex)
      if (start === -1) return

      if (start > lastIndex) {
        parts.push(answer.slice(lastIndex, start))
      }

      const color = hl.type === 'strength' ? 'bg-green-200' : 'bg-orange-200'
      parts.push(
        <span key={start} className={`${color} px-1`}>
          {hl.text}
          {hl.type === 'improvement' && hl.suggestion && (
            <div className="text-sm text-gray-600 mt-1">优化建议: {hl.suggestion}</div>
          )}
        </span>
      )

      lastIndex = start + hl.text.length
    })

    if (lastIndex < answer.length) {
      parts.push(answer.slice(lastIndex))
    }

    setMarkedAnswer(parts)
  }, [answer, highlights])

  return (
    <Card>
      <CardHeader>
        <CardTitle>智能诊断书</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="whitespace-pre-wrap">
          {markedAnswer}
        </div>
      </CardContent>
    </Card>
  )
}