/**
 * @file qualitative-feedback.v2.ts
 * @description 定性反馈数据结构 V2 版本
 * @version 2.0.0
 */

// 能力评分接口
export interface CompetencyScore {
  score: number; // 1-5分
  justification: string; // AI评分理由
}

// 亮点和改进建议接口
export interface FeedbackItem {
  competency: string; // 对应的能力维度
  description: string; // 具体描述
}

// 行动计划项接口
export interface ActionItem {
  title: string;
  description: string;
}

// V2版本的定性反馈数据结构
export interface QualitativeFeedbackV2 {
  sessionId: string;
  practiceDate: string;
  questionText: string;
  highlights: FeedbackItem[]; // 表现亮点
  improvements: FeedbackItem[]; // 改进建议
  competencyScores: Record<string, CompetencyScore>; // 核心：各维度直接评分
  actionPlan: ActionItem[]; // 行动计划
}

// 能力趋势分析接口
export interface CompetencyTrend {
  averageScore: number;
  trend: 'rising' | 'falling' | 'stable';
  history: number[];
  improvementSlope: number;
}

// 用于UI展示的能力分析数据
export interface QualitativeCompetencyDataV2 {
  competency: string;
  description: string;
  averageScore: number;
  trend: 'rising' | 'falling' | 'stable';
  history: number[];
  improvementSlope: number;
}