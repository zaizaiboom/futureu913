// 新的评估系统类型定义
// 支持"逐题评估，后端汇总"架构

/**
 * 单题评估请求接口
 */
export interface EvaluationRequest {
  questionId?: number
  question: string
  userAnswer: string
  keyPoints: string[]
  category: string
  difficulty: string
  stageType: string
  questionAnalysis: string
  answerFramework: string
}

/**
 * 优势项接口
 */
export interface Strength {
  competency: string
  description: string
}

/**
 * 改进建议接口
 */
export interface Improvement {
  competency: string
  suggestion: string
  example: string
}

/**
 * 核心能力评分接口
 */
export interface CompetencyScores {
  内容质量: number
  逻辑思维: number
  表达能力: number
  创新思维: number
  问题分析: number
}

/**
 * 单题评估响应接口 - V2
 * 对应AI面试教练的评估JSON结构
 */
export interface IndividualEvaluationResponse {
  preliminaryAnalysis: {
    isValid: boolean
    reasoning: string
  }
  performanceLevel: '助理级' | '编剧级' | '制片级' | '导演级' | '无法评估'
  summary: string
  strengths: Strength[]
  improvements: Improvement[]
  followUpQuestion: string
  competencyScores: CompetencyScores
  expertGuidance: {
    questionAnalysis: string
    answerFramework: string
  }
  questionContent?: string
  expectedAnswer?: string
}

/**
 * 能力评估项接口 - 保留用于兼容性
 */
export interface CompetencyEvaluation {
  competencyName: string
  currentState: string
  aiDiagnosis: string
}

/**
 * 综合建议接口 - 保留用于兼容性
 */
export interface OverallSuggestion {
  coreImprovement: string
  keyFocusArea: string
  strengthToMaintain: string
}

/**
 * 总体优势项接口
 */
export interface OverallStrength {
  competency: string
  description: string
}

/**
 * 总体改进建议接口
 */
export interface OverallImprovement {
  competency: string
  suggestion: string
  example?: string
}


/**
 * 总体表现汇总 - V2
 * AI生成的深度汇总报告
 */
export interface OverallSummary {
  overallLevel: string
  summary: string
  strengths: OverallStrength[]
  improvements: OverallImprovement[]
}

/**
 * 最终聚合报告接口
 * 包含所有单题详细评估和总体汇总
 */
export interface AggregatedReport {
  // 基本信息
  evaluationId: string
  stageInfo: {
    stageType: string
    stageTitle: string
    questionSetIndex: number
    questionCount: number
  }
  
  // 单题评估结果数组
  individualEvaluations: IndividualEvaluationResponse[]
  
  // AI生成的总体汇总
  overallSummary: OverallSummary
  
  // 时间戳
  timestamp: string
}

/**
 * 套题评估请求接口
 */
export interface QuestionSetEvaluationRequest {
  stageType: string
  questions: string[]
  answers: string[]
  stageTitle: string
  questionSetIndex?: number
  async?: boolean
}

/**
 * API错误响应接口
 */
export interface EvaluationError {
  error: string
  message: string
  timestamp: string
}

/**
 * 评估服务配置接口
 */
export interface EvaluationServiceConfig {
  apiUrl: string
  apiKey: string
  model: string
  temperature: number
  maxTokens: number
  timeout: number
}

/**
 * 备用评估生成器配置
 */
export interface FallbackConfig {
  defaultLevel: '助理级' | '专业级' | '资深级' | '总监级'
  defaultSummary: string
  defaultStrengths: Strength[]
  defaultImprovements: Improvement[]
  defaultThoughtPrompt: string
}