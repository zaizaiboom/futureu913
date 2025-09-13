// AI产品导师评估服务 - 产品方案融合最终版
// 融合了分阶段评估、场景化反馈和互动式追问，并优化了有效性判断

import type {
  EvaluationRequest,
  IndividualEvaluationResponse,
  EvaluationServiceConfig,
} from '../types/evaluation'
import type { CompetencyData } from '../types/competency';

class AIEvaluationService {
  private readonly config: EvaluationServiceConfig

  constructor() {
    this.config = {
      apiUrl: "https://api.siliconflow.cn/v1/chat/completions",
      apiKey: process.env.SILICONFLOW_API_KEY || "",
      model: "deepseek-ai/DeepSeek-V3", 
      temperature: 0.3, // 稍微提高温度，以增加反馈的趣味性和创造性
      maxTokens: 3000,
      timeout: 90000 // 适当延长超时，以应对更复杂的评估任务
    }
    
    if (!this.config.apiKey) {
      console.error("💥 [AI Service] SILICONFLOW_API_KEY 环境变量未设置")
      throw new Error("SILICONFLOW_API_KEY environment variable is required")
    }
  }

  /**
   * 构建AI产品导师评估提示词 - 已升级为最终融合版
   */
  private buildPrompt(data: EvaluationRequest): string {
     const { question, userAnswer, stageType, questionAnalysis, answerFramework } = data;

     return `
 # 角色：AI面试教练 (AI Interview Coach)
 
 ## 1. 你的核心身份与风格
 你是一位顶尖的、拥有“教练战术手册”的AI产品经理面试教练。你的沟通风格生动、通俗易懂且直白，使用日常语言，避免专业术语，直接告诉用户关键点。你的评估【必须】基于提供的“问题分析”和“建议回答思路”来进行。
 
 ## 2. 你的核心任务
 严格遵循下述【评估工作流】，对面试者的【单个】回答进行一次深度诊断，并返回结构化的JSON。
 
 ## 3. 教练战术手册 (你的评估基准)
 - **面试问题:** ${question}
 - **问题分析 (本题的核心考点):** ${questionAnalysis}
 - **建议回答思路 (高分答案的框架):** ${answerFramework}
 
 ## 4. 评估对象
 - **面试阶段:** ${stageType}
 - **用户回答:** ${userAnswer}
 
 ## 5. 评估工作流 (Chain of Thought)
 
 **【第一步：智能有效性检查 (Intelligent Validity Guard)】- 这是最关键的判断**
 - **这是你的守门员职责，但【必须】基于“教练战术手册”来判断。**
 - **检查流程:**
     1.  **初步筛选:** 回答是否是完全无意义的随机字符或人名？如果是，则直接判定为【无效回答】。
     2.  **深度对比:** 如果不是无意义内容，你【必须】将【用户回答】与【教练战术手册】（特别是“建议回答思路”）进行语义和概念上的对比。
     3.  **最终判定:** 只有当【用户回答】与【教练战术手册】在核心概念上**【零相关性】**时，才判定为【无效回答】。一个简短但切题的回答（例如，只提到了思路中的一个关键词）应被视为【有效回答】，并在后续步骤中指出其“内容不够充分”。
 - **处理方式:** 如果判定无效，立即停止后续评估，并使用专为【无效回答】准备的JSON模板输出。
 
 **【第二步：对比诊断 (Comparative Diagnosis)】**
 - **仅当**回答被判定为【有效】时，才进行此步骤。你需要将【用户回答】与【教练战术手册】进行详细比对。
 
 **【第三步：构思反馈与追问】**
 - **亮点 (Strengths):** 找到用户回答中，与“战术手册”匹配得最好、或者最有洞察力的部分。
 - **建议 (Improvements):** 找到用户回答与“战术手册”之间最大的差距，并构思场景化的、可操作的改进建议。
 - **追问 (Follow-up):** 基于用户的回答，构思一个能进一步考察其思维深度的互动式追问。
 
 **【第四步：组装JSON输出】**
 - 将所有分析结果，精准地填充到最终的JSON结构中。
 
 ## 6. 输出格式 (严格遵守)
 {
   "preliminaryAnalysis": {
     "isValid": <true 或 false>,
     "reasoning": "<对回答有效性的判定理由>"
   },
   "performanceLevel": "<如果isValid为false，则为'无法评估'；否则从'助理级', '编剧级', '制片级', '导演级'中选择>",
   "summary": "<如果isValid为false，则为'AI教练无法评估此回答...'；否则，基于与'战术手册'的对比，给出一句生动、调侃且专业的总结>",
   "strengths": [
     {
       "competency": "<优势领域>",
       "description": "<引用具体内容，说明其如何符合了'战术手册'中的要求或展现了个人亮点>"
     }
   ],
   "improvements": [
     {
       "competency": "<改进领域>",
       "suggestion": "<明确指出用户的回答与'战术手册'的差距所在，并用场景化的方式提出改进建议>",
       "example": "<提供一个可以直接使用的、优化的表达范例>"
     }
   ],
   "followUpQuestion": "<如果isValid为false，则鼓励用户重新尝试；否则，基于用户的回答，提出一个有价值的、互动式的追问>",
   "competencyScores": {
     "内容质量": <1-5分，评估回答的内容深度、准确性和相关性>,
     "逻辑思维": <1-5分，评估回答的逻辑结构、推理能力和条理性>,
     "表达能力": <1-5分，评估回答的表达清晰度、语言组织和沟通效果>,
     "创新思维": <1-5分，评估回答的创新性、独特见解和思维突破>,
     "问题分析": <1-5分，评估对问题的理解深度、分析角度和解决思路>
   },
   "expertGuidance": {
       "questionAnalysis": "${questionAnalysis}",
       "answerFramework": "${answerFramework}"
   }
 }
 `
   }

  async generateSuggestions(competencyData: CompetencyData[]): Promise<any> {
    const prompt = this.buildSuggestionPrompt(competencyData);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(this.config.apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.config.apiKey}` },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            {
              role: "system",
              content: "你是一位专业的AI职业发展教练。你的任务是严格遵循用户提供的框架和JSON格式要求，生成个性化的成长建议。确保输出是纯净的、可被程序直接解析的JSON对象。",
            },
            { role: "user", content: prompt },
          ],
          temperature: this.config.temperature,
          max_tokens: this.config.maxTokens,
          response_format: { type: "json_object" },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => "无法读取错误响应体");
        console.error(`💥 [AI Service] Suggestion API 响应错误 (${response.status}): ${errorText}`);
        throw new Error(`AI suggestion API error (${response.status})`);
      }

      const aiResponse = await response.json();
      const aiContent = aiResponse.choices[0]?.message?.content;
      if (!aiContent) { throw new Error("从AI API返回了空内容 (suggestions)") }

      try {
        const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("建议响应中未找到有效的JSON对象");
        }
      } catch (parseError) {
        console.error("❌ [AI Service] 解析AI建议响应失败:", aiContent);
        const message = parseError instanceof Error ? parseError.message : String(parseError);
        throw new Error(`从AI返回了无效的JSON (suggestions): ${message}`);
      }

    } catch (error) {
      console.error("💣 [AI Service] 生成建议过程中发生错误:", error);
      throw error;
    }
  }

  private buildSuggestionPrompt(competencyData: CompetencyData[]): string {
    const competenciesText = competencyData
      .map(c => {
        const currentLevel = c.current >= 80 ? '优秀' : c.current >= 60 ? '良好' : '需要提升';
        const previousLevel = c.previous >= 80 ? '优秀' : c.previous >= 60 ? '良好' : '需要提升';
        const historicalLevel = c.historical >= 80 ? '优秀' : c.historical >= 60 ? '良好' : '需要提升';
        return `${c.name}: 当前表现${currentLevel}, 上次表现${previousLevel}, 历史表现${historicalLevel}`;
      })
      .join('\n');

    return `
# 角色：AI职业发展教练

## 核心任务
你是一位专业的AI职业发展教练。请根据用户提供的能力评估数据，为他们生成2-3条高度个性化、可执行的成长建议。

## 用户能力数据
${competenciesText}

## 你的输出要求
1. **JSON格式**: 必须返回一个包含 \"suggestions\" 键的JSON对象，其值为一个建议对象数组。
2. **建议对象结构**: 每个建议对象必须包含以下字段：
   - title (string): 建议的简短标题
   - description (string): 对建议的详细阐述，需要具体、可操作
   - type (string): 建议类型，可选值为 improvement、strength 或 info
3. **建议内容**:
   - **识别关键**: 找出1-2个最需要提升的能力
   - **发挥优势**: 强调1个最突出的优势，并建议如何进一步利用
   - **基于表现趋势**: 你的建议需要基于能力表现的变化趋势，例如，当一个能力的当前表现相较于历史表现有所下滑时，应指出这是一个需要关注的领域
   - **语气**: 你的语气应该是鼓励性的、支持性的，同时保持专业

## JSON输出示例
{
  \"suggestions\": [
    {
      \"title\": \"重点提升：产品设计能力\",
      \"description\": \"您在\'产品设计\'方面的表现相较于历史水平有所下滑，从优秀降至需要提升。建议您系统性地学习产品设计原则，并通过拆解知名App来锻炼分析能力。\",
      \"type\": \"improvement\"
    },
    {
      \"title\": \"发挥优势：数据分析能力\",
      \"description\": \"您在\'数据分析\'上表现优秀且持续稳定，请继续保持！建议您在下一个项目中主动承担数据分析相关的任务，将此优势转化为项目成果。\",
      \"type\": \"strength\"
    }
  ]
}
`;
  }

  async evaluateAnswer(data: EvaluationRequest): Promise<IndividualEvaluationResponse> {
     try {
       if (!data.questionAnalysis || !data.answerFramework) {
         throw new Error("评估请求缺少'questionAnalysis'或'answerFramework'字段");
       }
 
       const prompt = this.buildPrompt(data)
       const controller = new AbortController()
       const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)
 
       const response = await fetch(this.config.apiUrl, {
         method: "POST",
         headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.config.apiKey}` },
         body: JSON.stringify({
           model: this.config.model,
           messages: [
             {
               role: "system",
               content: "你是一位顶尖的AI产品面试教练。你的任务是严格遵循用户提供的框架和JSON格式要求进行评估。你的首要职责是基于提供的'教练战术手册'来智能地判断回答的有效性。确保输出是纯净的、可被程序直接解析的JSON对象。",
             },
             { role: "user", content: prompt },
           ],
           temperature: this.config.temperature,
           max_tokens: this.config.maxTokens,
           response_format: { type: "json_object" },
         }),
         signal: controller.signal,
       })
 
       clearTimeout(timeoutId)
 
       if (!response.ok) {
         const errorText = await response.text().catch(() => "无法读取错误响应体");
         console.error(`💥 [AI Service] API 响应错误 (${response.status}): ${errorText}`);
         throw new Error(`AI API error (${response.status})`)
       }
 
       const aiResponse = await response.json()
       const aiContent = aiResponse.choices[0]?.message?.content
       if (!aiContent) { throw new Error("从AI API返回了空内容") }
        
       let evaluationResult: IndividualEvaluationResponse;
       try {
         const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
         if (jsonMatch) {
           evaluationResult = JSON.parse(jsonMatch[0]);
         } else {
           throw new Error("响应中未找到有效的JSON对象");
         }
       } catch (parseError) {
         console.error("❌ [AI Service] 解析AI响应失败:", aiContent)
         const message = parseError instanceof Error ? parseError.message : String(parseError);
         throw new Error(`从AI返回了无效的JSON: ${message}`)
       }
 
       this.validateIndividualEvaluationResult(evaluationResult)
       return evaluationResult
     } catch (error) {
       console.error("💣 [AI Service] 评估过程中发生错误:", error)
       const message = error instanceof Error ? error.message : String(error);
       return this.generateFallbackEvaluation(data, message)
     }
   }

  private validateIndividualEvaluationResult(result: any): void {
    if (!result || typeof result !== "object") { throw new Error("评估结果结构无效") }
    const requiredFields = ["preliminaryAnalysis", "performanceLevel", "summary", "strengths", "improvements", "followUpQuestion", "expertGuidance"];
    for (const field of requiredFields) {
      if (!(field in result)) {
        throw new Error(`缺少必需字段: ${field}`)
      }
    }
    if (!result.preliminaryAnalysis || typeof result.preliminaryAnalysis.isValid !== 'boolean') {
      throw new Error('preliminaryAnalysis 或其 isValid 属性无效')
    }
  }
  
  generateFallbackEvaluation(data: EvaluationRequest, errorMessage: string = "AI服务暂时不可用"): IndividualEvaluationResponse {
    return {
      preliminaryAnalysis: {
        isValid: false, 
        reasoning: `评估服务发生错误: ${errorMessage}`
      },
      performanceLevel: "无法评估",
      summary: "抱歉，AI教练的评估服务暂时遇到了点小麻烦，无法完成本次评估。",
      strengths: [],
      improvements: [
        {
          competency: "系统稳定性",
          suggestion: "这通常是一个临时性问题，比如网络波动或AI服务繁忙。",
          example: "请稍等片刻后，尝试重新提交或刷新页面。如果问题持续存在，请联系技术支持。"
        }
      ],
      followUpQuestion: "请尝试重新提交，我们期待你的精彩回答！",
      competencyScores: {
        内容质量: 0,
        逻辑思维: 0,
        表达能力: 0,
        创新思维: 0,
        问题分析: 0
      },
      expertGuidance: {
        questionAnalysis: data.questionAnalysis || "不可用",
        answerFramework: data.answerFramework || "不可用"
      }
    }
  }
}

// 延迟实例化，避免在客户端环境中执行构造函数
let _aiEvaluationService: AIEvaluationService | null = null

export const getAIEvaluationService = (): AIEvaluationService => {
  if (!_aiEvaluationService) {
    _aiEvaluationService = new AIEvaluationService()
  }
  return _aiEvaluationService
}

// 导出类本身，让API路由可以按需实例化
export { AIEvaluationService }

// 注意：请确保你的 'types/evaluation.ts' 文件也同步更新
export type { 
  EvaluationRequest, 
  IndividualEvaluationResponse
} from '../types/evaluation'
