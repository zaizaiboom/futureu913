// 文件路径: app/api/summarize-evaluations/route.ts
// 职责：接收多份单题评估报告，生成最终的总结

import { NextResponse, type NextRequest } from "next/server";
import type { IndividualEvaluationResponse } from "@/types/evaluation";
import { createClient } from "@/lib/supabase/server";

// 这是一个简化的AI调用，你可以将它放在ai-service.ts中或直接在此使用
async function getAISummary(evaluations: IndividualEvaluationResponse[]): Promise<{ overallSummary: string; overallLevel: string; }> {
    const apiKey = process.env.SILICONFLOW_API_KEY || "";
    if (!apiKey) throw new Error("API Key not configured for summarizer");

    const summaryPrompt = `
# 角色：AI首席面试官

## 你的任务
你已经看完了你的AI教练团队对候选人几道题的详细评估。现在，请你基于这些独立的评估报告，为候选人撰写一份最终的、高度概括的【综合评估总结】。

## 评估报告原文
${JSON.stringify(evaluations, null, 2)}

## 你的要求
1.  **综合定级:** 通读所有报告，给出一个总体的 \`overallLevel\` ('助理级', '编剧级', '制片级', '导演级')。
2.  **撰写总结:** 用你生动、风趣且专业的风格，写一段2-3句话的 \`overallSummary\`。这段话应该能概括出候选人最突出的优点和最需要关注的核心短板。

## 输出格式 (严格遵守JSON)
{
  "overallLevel": "<你的综合评级>",
  "overallSummary": "<你的总结性文字>"
}
    `;

    const response = await fetch("https://api.siliconflow.cn/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
            model: "deepseek-ai/DeepSeek-V3",
            messages: [{ role: "user", content: summaryPrompt }],
            temperature: 0.5,
            response_format: { type: "json_object" },
        }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`AI API call failed with status ${response.status}: ${errorText}`);
      throw new Error(`AI summarizer API call failed: ${errorText}`);
    }
    
    const result = await response.json();
    const content = result.choices[0]?.message?.content;
    return JSON.parse(content);
}


export async function POST(request: NextRequest) {
    try {
        const { individualEvaluations, stageInfo, sessionId } = await request.json();

        if (!individualEvaluations || individualEvaluations.length === 0 || !sessionId) {
            return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
        }

        const summaryResult = await getAISummary(individualEvaluations);

        const supabase = await createClient();
        const { error } = await supabase
            .from('evaluation_tasks')
            .upsert({
                session_id: sessionId,
                question_index: -1,
                status: 'completed',
                result: JSON.stringify(summaryResult),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });

        if (error) {
            console.error('Failed to store summary:', error);
            return NextResponse.json({ error: "存储总结失败" }, { status: 500 });
        }

        return NextResponse.json(summaryResult);
    } catch (error) {
        console.error('Error in summarize-evaluations:', error);
        return NextResponse.json({ error: "生成总结时发生错误" }, { status: 500 });
    }
}