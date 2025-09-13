/**
 * @file qualitative-analytics.v2.ts
 * @description 定性分析模块 V2 版本
 * @version 2.0.0
 * * @changelog
 * V2 核心架构变更:
 * 1.  [废除] 废除了基于“亮点/建议”比例来计算能力等级的 `analyzeCompetencyLevel` 方法。
 * - 原因: V1 的比例法无法区分“平庸”与“优缺点共存”的情况，评估粒度过粗。
 * 2.  [引入] 引入了全新的数据结构，要求 AI 对每次练习直接进行多维度评分 (`competencyScores`)。
 * - 优势: 将模糊的定性判断转化为精准的量化数据，评估更准确、更稳定。
 * 3.  [废除] 彻底移除了 `TagDiversityManager` 模块。
 * - 原因: V1 的标签多样性机制会为了“新鲜感”而刻意回避用户的核心短板，与成长目标背道而驰。
 * 4.  [引入] 引入了基于历史评分的 `analyzeCompetencyTrends` 趋势分析函数。
 * - 优势: 通过分析每个能力维度的分数变化曲线，可以更精确地识别用户的长期优势、核心瓶颈以及真实的进步轨迹。
 * 5.  [重构] `generateGrowthAdvice` 和 `generateQualitativeCompetencyData` 等核心函数已完全基于新的评分和趋势数据进行重构，使建议更具针对性。
 */

import {
  QualitativeFeedbackV2,
  CompetencyScore,
  QualitativeCompetencyDataV2,
  CompetencyTrend,
  ActionItem,
} from '@/types/qualitative-feedback.v2'; // 注意：这里我们假设类型文件也已升级到 V2

// 定义核心能力维度 (保持不变)
const CORE_COMPETENCIES = [
  '内容质量',
  '逻辑思维',
  '表达能力',
  '创新思维',
  '问题分析'
];

// --------------------------------------------------------------------------------
// V2 核心分析函数
// --------------------------------------------------------------------------------

/**
 * [V2 新增] 分析所有能力维度的历史趋势
 * 这是 V2 架构的核心，负责从历次评分中提炼洞察。
 * @param feedbacks - 包含 V2 评分结构的反馈历史记录
 * @returns - 一个包含每个能力维度趋势分析结果的对象
 */
export const analyzeCompetencyTrends = (feedbacks: QualitativeFeedbackV2[]): Record<string, CompetencyTrend> => {
  const trends: Record<string, CompetencyTrend> = {};

  if (feedbacks.length === 0) {
    return trends;
  }

  CORE_COMPETENCIES.forEach(competency => {
    // 提取该维度下的所有历史评分
    const scores = feedbacks
      .map(fb => fb.competencyScores[competency]?.score)
      .filter((score): score is number => score !== undefined);

    if (scores.length === 0) {
      trends[competency] = {
        averageScore: 0,
        trend: 'stable',
        history: [],
        improvementSlope: 0,
      };
      return;
    }

    // 计算平均分
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;

    // 分析趋势 (简化版线性回归斜率计算)
    let trend: 'rising' | 'falling' | 'stable' = 'stable';
    let improvementSlope = 0;
    if (scores.length > 1) {
        const firstHalfAvg = scores.slice(0, Math.floor(scores.length / 2)).reduce((a, b) => a + b, 0) / Math.floor(scores.length / 2);
        const secondHalfAvg = scores.slice(Math.ceil(scores.length / 2)).reduce((a, b) => a + b, 0) / Math.ceil(scores.length / 2);
        improvementSlope = secondHalfAvg - firstHalfAvg;
        if (improvementSlope > 0.5) trend = 'rising';
        else if (improvementSlope < -0.5) trend = 'falling';
    }

    trends[competency] = {
      averageScore,
      trend,
      history: scores,
      improvementSlope,
    };
  });

  return trends;
};


/**
 * [V2 重构] 生成综合成长建议
 * 完全基于新的趋势分析结果，给出更聚焦、更数据驱动的建议。
 * @param feedbacks - V2 版本的反馈历史记录
 * @returns - 一段个性化的成长建议字符串
 */
export const generateGrowthAdviceV2 = (feedbacks: QualitativeFeedbackV2[]): string => {
  if (feedbacks.length < 3) { // 练习次数太少，不生成建议
    return '请继续完成至少3次练习，我们将为您生成更精准的个性化成长建议。';
  }

  const trends = analyzeCompetencyTrends(feedbacks);
  
  // 找出优势和短板
  const sortedCompetencies = Object.entries(trends).sort(([, a], [, b]) => a.averageScore - b.averageScore);
  
  const weakestCompetency = sortedCompetencies[0];
  const strongestCompetency = sortedCompetencies[sortedCompetencies.length - 1];

  let advice = `基于您最近 ${feedbacks.length} 次的练习历史分析：\n`;
  
  // 点评最强项
  if (strongestCompetency && strongestCompetency[1].averageScore > 3.5) {
    advice += `- **核心优势**: 您的 **${strongestCompetency[0]}** 能力表现最为突出，展现出优秀的水平，请继续保持！\n`;
  }
  
  // 诊断最弱项
  if (weakestCompetency && weakestCompetency[1].averageScore < 3.0) {
    advice += `- **首要提升项**: 我们发现 **${weakestCompetency[0]}** 是您当前最需要突破的瓶颈，表现还有较大提升空间。\n`;

    // 检查最弱项是否有进步
    if (weakestCompetency[1].trend === 'rising') {
        advice += `  - 令人欣喜的是，该项能力正处于**上升通道**，请坚持针对性练习。\n`;
    } else {
        advice += `  - 建议您在后续练习中，重点关注与 **${weakestCompetency[0]}** 相关的题目，并回顾我们给出的改进建议。\n`;
    }
  }

  advice += '\n持续的练习和复盘，是实现能力跃迁的关键。';
  
  return advice;
};


/**
 * [V2 重构] 生成用于 UI 展示的能力分析数据
 * @param feedbacks - V2 版本的反馈历史记录
 * @returns - 一个包含所有能力维度及其趋势分析结果的数组
 */
export const generateQualitativeCompetencyDataV2 = (
  feedbacks: QualitativeFeedbackV2[]
): QualitativeCompetencyDataV2[] => {
  const trends = analyzeCompetencyTrends(feedbacks);
  
  const competencyDescriptions: Record<string, string> = {
    '内容质量': '回答内容的深度、准确性和相关性',
    '逻辑思维': '思路清晰度、论证逻辑和结构化表达',
    '表达能力': '语言流畅度、用词准确性和沟通效果',
    '创新思维': '创意想法、独特视角和解决方案创新性',
    '问题分析': '问题理解深度、分析框架和解决思路'
  };

  return CORE_COMPETENCIES.map(competency => {
    const trendData = trends[competency] || { averageScore: 0, trend: 'stable', history: [] };
    return {
      competency: competency,
      description: competencyDescriptions[competency],
      ...trendData,
    };
  });
};


// --------------------------------------------------------------------------------
// V2 模拟数据生成器 (用于开发和测试)
// --------------------------------------------------------------------------------

/**
 * [V2 重构] 生成模拟的、包含直接评分的反馈数据
 * @param count - 要生成的反馈记录数量
 * @returns - 一个包含 V2 结构反馈数据的数组
 */
export const generateMockQualitativeFeedbackV2 = (count: number): QualitativeFeedbackV2[] => {
    // [恢复] 重新引入详细的模拟数据列表，并关联到核心能力维度
    const mockHighlights = [
        { competency: '创新思维', text: '创意联想能力' },
        { competency: '逻辑思维', text: '逻辑结构清晰' },
        { competency: '表达能力', text: '表达流畅自然' },
        { competency: '内容质量', text: '内容相关性强' },
        { competency: '内容质量', text: '案例运用恰当' },
        { competency: '逻辑思维', text: '思维敏捷' },
        { competency: '创新思维', text: '观点独特' },
        { competency: '问题分析', text: '分析深入' }
    ];

    const mockImprovements = [
        { competency: '内容质量', text: '建议加强回答与问题的相关性，避免偏题' },
        { competency: '逻辑思维', text: '可以进一步提升论述的逻辑连贯性' },
        { competency: '内容质量', text: '建议增加具体案例来支撑观点' },
        { competency: '问题分析', text: '可以进一步深入分析问题的本质' },
        { competency: '逻辑思维', text: '回答逻辑混乱，需要重新组织思路' },
        { competency: '内容质量', text: '回答完全偏离问题核心，需要重新理解题意' },
        { competency: '表达能力', text: '语言表达可以更加简洁明了' },
        { competency: '表达能力', text: '部分用词不够准确，可以进一步优化' }
    ];

    const mockActionPlans: ActionItem[] = [
        { title: '产品思维基础', description: '学习产品设计的基本原理和方法论' },
        { title: '逻辑思维训练', description: '通过逻辑推理练习提升思维能力' },
        { title: '案例分析练习', description: '多做商业案例分析，提升实战能力' },
    ];
    
    return Array.from({ length: count }, (_, i) => {
        const practiceDate = new Date(Date.now() - (count - 1 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        // 模拟能力随时间进步的趋势
        const progressFactor = i / (count - 1 || 1); // 0 -> 1

        const competencyScores: Record<string, CompetencyScore> = {};
        CORE_COMPETENCIES.forEach(comp => {
            // 基础分 + 进步分 + 随机波动
            const baseScore = 1.5 + Math.random(); // 1.5 - 2.5
            const progressScore = 2 * progressFactor; // 0 -> 2
            const randomNoise = (Math.random() - 0.5); // -0.5 -> 0.5
            let finalScore = Math.round(Math.max(1, Math.min(5, baseScore + progressScore + randomNoise)));

            competencyScores[comp] = {
                score: finalScore,
                justification: `在 ${comp} 方面，您的表现${finalScore >= 4 ? '优秀' : finalScore >= 3 ? '良好' : '需要提升'}，因为... (此处为AI生成的具体理由)`
            };
        });
        
        // [增强] 从详细列表中随机选择亮点和建议
        const selectedHighlights = [...Array(2)].map(() => {
            const randomHighlight = mockHighlights[Math.floor(Math.random() * mockHighlights.length)];
            return { competency: randomHighlight.competency, description: randomHighlight.text };
        });

        const selectedImprovements = [...Array(2)].map(() => {
            const randomImprovement = mockImprovements[Math.floor(Math.random() * mockImprovements.length)];
            return { competency: randomImprovement.competency, description: randomImprovement.text };
        });

        return {
            sessionId: `session_v2_${i + 1}`,
            practiceDate,
            questionText: `模拟面试问题 ${i + 1}`,
            highlights: selectedHighlights,
            improvements: selectedImprovements,
            competencyScores, // V2 核心数据
            actionPlan: mockActionPlans.slice(0, 1),
        };
    });
};


// --------------------------------------------------------------------------------
// V1 函数保留或废弃说明
// --------------------------------------------------------------------------------
// `getMostFrequentSuggestion`: V2 中被 `generateGrowthAdviceV2` 的根本性诊断所取代，不再需要。
// `getTotalHighlights`: 简单的计数功能，如果 UI 需要可以保留，但不再是核心分析的一部分。
// `analyzeCompetencyLevel`: 已被 `analyzeCompetencyTrends` 完全取代，必须废弃。
// `getCompetencyTagTrends`: V2 中不再关注单个标签的出现，而是关注能力维度的分数趋势，因此废弃。
// `TagDiversityManager`: 已彻底移除。
// `getHistoryFeedbackNextSteps`: 简单的字段提取，可以保留。

export const getHistoryFeedbackNextSteps = (feedback: QualitativeFeedbackV2): ActionItem[] => {
    return feedback.actionPlan || [];
};