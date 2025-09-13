// QualitativeFeedback 数据结构定义
// 用于替代基于分数的评估体系，采用定性诊断和能力标签

export interface FeedbackDetail {
  title: string;       // 例如: "创意联想能力" 或 "内容相关性"
  description: string; // 详细的文字描述
  severity?: 'critical' | 'moderate' | 'minor'; // 严重性等级（仅用于建议）
}

export interface ActionItem {
  title: string;       // 例如: "产品思维基础"
  description: string; // 详细的任务描述
}

export interface QualitativeFeedback {
  sessionId: string;
  practiceDate: string; // "YYYY-MM-DD"
  questionText: string;
  
  // 对应"评估完成"部分
  overallAssessment: {
    level: string;     // 例如: "助理级表现"
    summary: string;   // 详细的总体评价
  };

  // 对应"表现亮点"部分
  highlights: FeedbackDetail[];

  // 对应"提升建议"部分
  suggestions: FeedbackDetail[];

  // 对应"行动计划"部分
  actionPlan: ActionItem[];
}

// 能力等级定义
export type CompetencyLevel = '初步掌握' | '熟练应用' | '表现出色';

// 能力标签趋势数据
export interface CompetencyTagTrend {
  date: string;
  tagTitle: string;
  tagType: 'highlight' | 'suggestion';
  appeared: boolean; // 该标签是否在该次练习中出现
}

// 重构后的能力数据结构
export interface QualitativeCompetencyData {
  competency: string;
  description: string;
  level: CompetencyLevel;
  highlightCount: number;
  suggestionCount: number;
}

// 分析工具函数类型
export interface QualitativeAnalytics {
  // 获取最频繁的提升建议
  getMostFrequentSuggestion: (feedbacks: QualitativeFeedback[]) => string;
  
  // 计算累计亮点数量
  getTotalHighlights: (feedbacks: QualitativeFeedback[]) => number;
  
  // 分析能力等级
  analyzeCompetencyLevel: (competency: string, feedbacks: QualitativeFeedback[]) => CompetencyLevel;
  
  // 生成综合成长建议
  generateGrowthAdvice: (feedbacks: QualitativeFeedback[]) => string;
  
  // 获取能力标签趋势数据
  getCompetencyTagTrends: (feedbacks: QualitativeFeedback[]) => CompetencyTagTrend[];
}