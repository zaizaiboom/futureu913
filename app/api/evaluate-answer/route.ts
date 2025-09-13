import { type NextRequest, NextResponse } from "next/server"
import { getAIEvaluationService } from "../../../lib/ai-service"
import { createClient } from '@supabase/supabase-js'

const SILICONFLOW_API_URL = "https://api.siliconflow.cn/v1/chat/completions"
const SILICONFLOW_API_KEY = process.env.SILICONFLOW_API_KEY

interface EvaluationRequest {
  questionId: number
  question: string
  userAnswer: string
  keyPoints: string[]
  category: string
  difficulty: string
  stage?: string // Added stage parameter for three-stage evaluation
}

interface PenaltyResponse {
  isPenalty: true
  message: string
  reason: string
  suggestions: string[]
}

interface EvaluationResponse {
  AIPM_Level: string
  summary: string
  strengths: Array<{
    competency: string
    description: string
  }>
  improvements: Array<{
    competency: string
    suggestion: string
    example: string
  }>
  thoughtPrompt: string
}

function buildEvaluationPrompt(data: EvaluationRequest): string {
  const stageConfig = getStageConfig(data.stage || "professional")

  return `# 角色：AI产品导师 (AI Product Mentor)

## 1. 你的核心身份
你是一位顶尖的AI产品导师。曾任Google AI的首席产品经理，现在致力于培养下一代AI产品领导者。你的反馈风格是：
- **精准犀利:** 能一针见血地指出问题的核心。
- **深度专业:** 深度理解AI技术、商业和用户体验的交叉点。
- **富有洞察:** 能从回答中洞察出面试者的思维模型和潜力。
- **绝对务实:** 所有的建议都必须是具体的、可执行的、源于真实世界AI产品开发经验的。

## 2. 你的核心任务
严格遵循下述的【深度评估框架】，对面试者的【单个】回答进行一次彻底的、多维度的诊断，并以结构化的JSON格式返回你的分析。

## 3. 评估的输入信息
- **面试问题:** ${data.question}
- **问题类别:** ${data.category}
- **难度等级:** ${data.difficulty}
- **回答关键点 (供你评估内容深度和广度的内部参考基准):**
${data.keyPoints.map((point, index) => `- ${point}`).join("\n")}
- **用户回答:** ${data.userAnswer}

## 4. 你的深度评估框架 (Chain of Thought)
你在生成最终的JSON前，必须在内部严格遵循以下思考步骤，以确保评估的准确性：

**第一步：内容评估 (Coverage & Depth)**
- **要点覆盖:** 回答是否覆盖了【回答关键点】？是全部覆盖还是部分覆盖？
- **认知深度:** 不要只看"有没有提到"，要看"理解多深"。例如，对于RAG，是仅仅"知道这个词"，还是能清晰阐述它与微调(Fine-tuning)在成本、数据、效果上的权衡(Trade-offs)？

**第二步：AI产品思维评估 (AI Product Thinking)**
这是评估的核心。你要判断回答中是否体现了AI产品经理的关键思维模式：
- **问题-技术匹配 (Problem-Tech Fit):** 是否清晰地将AI技术与一个真实的用户问题或商业痛点联系起来？
- **可行性与边界 (Feasibility & Boundaries):** 是否考虑了技术实现的现实约束？比如数据冷启动、模型能力的边界、潜在的伦理风险？
- **数据飞轮 (Data Flywheel):** 是否展现了"产品产生数据 -> 数据优化模型 -> 模型提升产品"的闭环思考？
- **AI用户体验 (AI-Specific UX):** 是否考虑了AI产品特有的体验问题？例如如何处理模型的"不确定性"、如何向用户解释AI的决策、如何建立信任？

**第三步：结构与逻辑评估 (Structure & Logic)**
- **结构化程度:** 回答的框架是什么？是高度结构化的（如STAR, PEEC），还是随意的意识流？
- **逻辑链条:** 论点和论据之间的逻辑关系是否清晰、有说服力？
- **表达清晰度:** 能否用简练的语言，向非技术背景的同事（如市场、销售）解释复杂的技术概念？

**第四步：综合诊断与定级 (Synthesis & Leveling)**
- **整合分析:** 基于以上三步的严谨分析，形成一个整体判断。
- **内部定级:** 在心中为本次回答确定一个表现等级，并用一句话说明定级的核心理由。
- **填充JSON:** 将所有分析结果，精准地填充到下面的JSON结构中。

## 5. 输出格式 (严格遵守此JSON结构)
{
  "AIPM_Level": "<助理级 | 专业级 | 资深级 | 总监级>",
  "summary": "<用精准、专业的语言，一句话点明此次回答的整体水平和核心得失。避免使用过于花哨的比喻。>",
  "strengths": [
    {
      "competency": "<从'内容深度', 'AI产品思维', '结构与逻辑'中选择一个>",
      "description": "<精准描述优点，并引用回答中的关键词或句子作为证据。说明这个优点为什么对于AI PM角色很重要。>"
    }
  ],
  "improvements": [
    {
      "competency": "<从'内容深度', 'AI产品思维', '结构与逻辑'中选择一个>",
      "suggestion": "<直接指出问题的核心所在，并解释其潜在的负面影响。>",
      "example": "<提供一个可以直接套用的、更优的表达范例或思考框架，以展示'好的答案'应该是什么样。>"
    }
  ],
  "thoughtPrompt": "<提出一个深刻的、开放性的追问，旨在激发用户对该问题进行更深层次的思考。例如：'如果考虑到数据隐私的法规要求，你刚才提到的数据飞轮设计需要做出哪些调整？'>"
}

## 评估要求
1. 严格按照深度评估框架进行分析
2. 重点关注AI产品思维的体现
3. 提供精准、专业的反馈，避免过于花哨的比喻
4. 确保JSON格式正确，所有字符串值用双引号包围
5. 所有建议都要具体可操作

${stageConfig.specificGuidance}

直接输出JSON，不要任何其他格式。`
}

function getStageConfig(stage: string) {
  switch (stage) {
    case "hr":
      return {
        stageName: "HR面试",
        specificGuidance: `
特别要求：
- 核心诊断必须直接指出：缺少职业规划、没有团队案例、动机不明确、没说离职原因、缺少自我认知
- 句子分析必须告诉他具体加什么词、删什么词，不要用任何比喻
- 追问必须针对他回答中的空白点，直接问
- 总结直接说他哪里需要补充，比如：'你没说为什么选择这个行业'、'你没提到团队合作经验'、'你没说职业目标'`,
      }
    case "final":
      return {
        stageName: "终面",
        specificGuidance: `
特别要求：
- 核心诊断必须直接指出：缺少战略思维、没有行业洞察、格局不够、缺少管理经验、没有商业敏感度
- 句子分析必须提供高管级别的具体表达，不要用任何比喻
- 追问必须考察他的认知盲区，直接问
- 总结直接说他的能力边界在哪里，比如：'你对行业趋势了解不够'、'你缺少管理经验'、'你没有战略思维'`,
      }
    default:
      return {
        stageName: "专业面试",
        specificGuidance: `
特别要求：
- 核心诊断必须直接指出：缺少产品思维、技术理解不足、没有用户视角、缺少数据分析、没有竞品分析
- 句子分析必须告诉他产品经理应该怎么表达，不要用任何比喻
- 追问必须针对他的专业能力空白，直接问
- 总结直接说他的专业水平和需要提升的具体方面，比如：'你没说用户调研方法'、'你缺少数据分析'、'你没提到竞品对比'`,
      }
  }
}

function cleanJsonResponse(content: string): string {
  console.log("🔧 [JSON清理] 开始清理AI响应")

  // Remove markdown code blocks and language identifiers
  let cleaned = content.replace(/```json\s*/g, "").replace(/```\s*/g, "")

  // Remove any leading/trailing whitespace
  cleaned = cleaned.trim()

  // Remove any text before the first { and after the last }
  const firstBrace = cleaned.indexOf("{")
  const lastBrace = cleaned.lastIndexOf("}")

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1)
  }

  // Fix common JSON formatting issues
  cleaned = cleaned
    // Remove any trailing commas before closing braces/brackets
    .replace(/,(\s*[}\]])/g, "$1")
    // Fix unescaped quotes in strings
    .replace(/([^\\])"/g, '$1\\"')
    // Fix the previous replacement if it affected JSON structure
    .replace(/\\"/g, '"')
    // Ensure proper spacing around colons and commas
    .replace(/:\s*/g, ": ")
    .replace(/,\s*/g, ", ")
    // Remove any control characters that might cause parsing issues
    .replace(/[\x00-\x1F\x7F]/g, "")
    // Fix any double quotes that got mangled
    .replace(/"{2,}/g, '"')

  console.log("✨ [JSON清理] 清理完成，长度:", cleaned.length)

  // Validate basic JSON structure
  const openBraces = (cleaned.match(/{/g) || []).length
  const closeBraces = (cleaned.match(/}/g) || []).length

  if (openBraces !== closeBraces) {
    console.warn("⚠️ [JSON清理] 大括号不匹配:", { openBraces, closeBraces })
  }

  return cleaned
}

function detectLowQualityAnswer(userAnswer: string, question: string): PenaltyResponse | null {
  const answer = userAnswer.trim().toLowerCase()
  const questionWords = question
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 3)

  // Check for empty or too short answers
  if (answer.length < 10) {
    return {
      isPenalty: true,
      message: "请认真作答再继续解析",
      reason: "回答内容过于简短，无法进行有效评估",
      suggestions: ["请提供至少50字以上的详细回答", "结合具体案例或经验来阐述你的观点", "展示你的思考过程和分析逻辑"],
    }
  }

  // Check for random/nonsensical content
  const randomPatterns = [
    /^[a-z\s]*$/i, // Only letters and spaces (likely random typing)
    /(.)\1{4,}/, // Repeated characters (aaaaa, 11111)
    /^[0-9\s]*$/, // Only numbers and spaces
    /^[^\u4e00-\u9fa5a-zA-Z]*$/, // No Chinese or English characters
  ]

  for (const pattern of randomPatterns) {
    if (pattern.test(answer) && answer.length < 50) {
      return {
        isPenalty: true,
        message: "请认真作答再继续解析",
        reason: "检测到无意义的随机输入",
        suggestions: ["请用中文或英文认真回答问题", "避免输入无关的字符或数字", "展示你对问题的真实理解和思考"],
      }
    }
  }

  // Check for completely irrelevant answers
  const commonIrrelevantPhrases = [
    "不知道",
    "不清楚",
    "没想过",
    "随便",
    "无所谓",
    "都行",
    "看情况",
    "i don't know",
    "no idea",
    "whatever",
    "anything",
    "doesn't matter",
  ]

  const hasRelevantContent = questionWords.some(
    (word) => answer.includes(word) || answer.includes(word.substring(0, 3)),
  )

  const isIrrelevant =
    commonIrrelevantPhrases.some((phrase) => answer.includes(phrase)) && !hasRelevantContent && answer.length < 100

  if (isIrrelevant) {
    return {
      isPenalty: true,
      message: "请认真作答再继续解析",
      reason: "回答与问题不相关或过于敷衍",
      suggestions: ["请仔细阅读问题并针对性回答", "分享你的真实想法和经验", "即使不确定也请尝试分析和思考"],
    }
  }

  // Check for copy-paste or template answers
  const templatePhrases = [
    "根据我的理解",
    "我认为这个问题",
    "首先其次最后",
    "综上所述",
    "in my opinion",
    "first second third",
    "in conclusion",
  ]

  const templateCount = templatePhrases.filter((phrase) => answer.includes(phrase.toLowerCase())).length

  if (templateCount >= 3 && answer.length < 200) {
    return {
      isPenalty: true,
      message: "请认真作答再继续解析",
      reason: "回答过于模板化，缺乏个人思考",
      suggestions: ["请用自己的话来表达观点", "结合具体的工作经验或案例", "展示你独特的思考角度和见解"],
    }
  }

  return null
}

export async function POST(request: NextRequest) {
  try {
    if (!SILICONFLOW_API_KEY) {
      console.error("❌ [API] SiliconFlow API密钥未配置")
      return NextResponse.json(
        {
          error: "SiliconFlow API key not configured",
          message: "请在项目设置中添加 SILICONFLOW_API_KEY 环境变量",
        },
        { status: 500 },
      )
    }

    const body: EvaluationRequest = await request.json()
    console.log("📝 [API] 收到API式教练评估请求:", {
      questionId: body.questionId,
      category: body.category,
      difficulty: body.difficulty,
      stage: body.stage || "professional",
      answerLength: body.userAnswer?.length,
    })

    // 验证请求数据
    if (!body.question || !body.userAnswer || !body.keyPoints) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const penaltyCheck = detectLowQualityAnswer(body.userAnswer, body.question)
    if (penaltyCheck) {
      console.log("⚠️ [惩罚机制] 检测到低质量回答，触发拒绝评分:", penaltyCheck.reason)
      return NextResponse.json(penaltyCheck, { status: 422 }) // 422 Unprocessable Entity
    }

    const prompt = buildEvaluationPrompt(body)
    console.log("📋 [API] 构建API式提示词完成")

    const requestPayload = {
      model: "deepseek-ai/DeepSeek-V3",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2, // Reduced temperature for more consistent API-like responses
      max_tokens: 3000,
    }

    const response = await fetch(SILICONFLOW_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SILICONFLOW_API_KEY}`,
      },
      body: JSON.stringify(requestPayload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ [API] SiliconFlow API错误:`, errorText)
      throw new Error(`SiliconFlow API error: ${response.status}`)
    }

    const aiResponse = await response.json()
    const aiContent = aiResponse.choices[0]?.message?.content

    if (!aiContent) {
      throw new Error("No response from AI")
    }

    console.log("🔧 [API] 原始AI响应长度:", aiContent.length)

    let evaluationResult: EvaluationResponse
    try {
      const cleanedContent = cleanJsonResponse(aiContent)
      console.log("✨ [API] JSON清理完成，准备解析")

      try {
        evaluationResult = JSON.parse(cleanedContent)

        if (
          !evaluationResult.AIPM_Level ||
          !evaluationResult.summary ||
          !evaluationResult.strengths ||
          !evaluationResult.improvements ||
          !evaluationResult.thoughtPrompt
        ) {
          console.warn("⚠️ [API] 响应格式不完整，可能触发拒绝评分机制")
        }
      } catch (parseError) {
        console.error("❌ [JSON解析] 详细错误信息:", parseError)
        console.error("🔍 [JSON解析] 清理后内容前500字符:", cleanedContent.substring(0, 500))

        throw parseError
      }

      console.log("✅ [API] AI产品导师评估解析成功:", {
        AIPM_Level: evaluationResult.AIPM_Level,
        hasSummary: !!evaluationResult.summary,
        strengthsCount: evaluationResult.strengths?.length,
        improvementsCount: evaluationResult.improvements?.length,
        hasThoughtPrompt: !!evaluationResult.thoughtPrompt,
      })
    } catch (parseError) {
      console.error("❌ [API] JSON解析失败:", parseError)
      throw new Error("Invalid AI response format")
    }

    return NextResponse.json(evaluationResult)
  } catch (error) {
    console.error("💥 [API] API式教练评估错误:", error)

    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      {
        error: errorMessage,
        message: "AI教练API服务暂时不可用，请稍后再试",
      },
      { status: 500 },
    )
  }
}
