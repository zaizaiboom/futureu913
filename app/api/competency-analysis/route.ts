// 文件路径: app/api/competency-analysis/route.ts
// 职责：分析用户能力评估数据，提供历史对比和成长洞察 (重构版)

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// --- 接口定义 (保持不变) ---
interface CompetencyScores {
  content_score: number;
  logic_score: number;
  expression_score: number;
  overall_score: number;
  created_at: string;
}

interface CompetencyData {
  name: string;
  current: number;
  previous: number;
  historical: number;
  fullMark: number;
}

interface GrowthInsight {
  competency: string;
  status: 'progress' | 'stagnant' | 'decline';
  description: string;
  change: string;
}

interface CompetencyAnalysisResponse {
  competencyData: CompetencyData[];
  growthInsights: GrowthInsight[];
  lastScores: Partial<Omit<CompetencyScores, 'created_at'>>;
  historicalAverageScores: Partial<Omit<CompetencyScores, 'created_at'>>;
}

// --- 配置化模块 ---

// 1. 能力评估模型配置
const COMPETENCY_MODEL: Record<string, { dependencies: Partial<Record<keyof Omit<CompetencyScores, 'created_at'>, number>> }> = {
  '战略思维力': { dependencies: { content_score: 0.6, logic_score: 0.4 } },
  '落地执行力': { dependencies: { logic_score: 0.5, overall_score: 0.5 } },
  '沟通表达力': { dependencies: { expression_score: 1.0 } },
  '团队协作力': { dependencies: { expression_score: 0.4, overall_score: 0.6 } },
  '创新思维力': { dependencies: { content_score: 0.7, logic_score: 0.3 } },
  '学习适应力': { dependencies: { overall_score: 1.0 } }
};

// 2. 分析参数配置 (根据用户需求调整)
const ANALYSIS_CONFIG = {
  CURRENT_PERIOD_SIZE: 1, // 当前分析窗口：最近1次
  PREVIOUS_PERIOD_SIZE: 1, // 上一阶段分析窗口：再上1次
  MIN_SESSIONS_FOR_COMPARISON: 1, // 只要有上一阶段的数据（1次），就进行对比
  GROWTH_THRESHOLDS: {
    SIGNIFICANT_PROGRESS: 0.05, // 进步超过5%为显著 (用户要求)
    PROGRESS: 0.01, // 进步超过1%为稳步
    DECLINE: -0.05, // 下降超过5%为需要关注
  },
  FULL_MARK: 100,
};

// --- 核心逻辑函数 (重构) ---

type RawScores = Omit<CompetencyScores, 'created_at'>;
type CompetencyResult = Record<string, number>;

/**
 * 根据评估模型，从原始得分计算能力维度得分
 * @param sessions 一组练习会话
 * @returns 各项能力的得分
 */
const COMPETENCY_DESCRIPTIONS: Record<string, string> = {
  '战略思维力': '指的是在产品规划中考虑长期市场趋势和竞争格局的能力，例如制定产品路线图时如何平衡短期收益与长期愿景。',
  '落地执行力': '指的是将想法转化为实际产品的能力，例如管理项目进度、资源分配和风险控制。',
  '沟通表达力': '指的是清晰传达想法的能力，例如在会议中有效呈现产品方案。',
  '团队协作力': '指的是与团队合作的能力，例如协调不同部门共同完成任务。',
  '创新思维力': '指的是产生新想法的能力，例如设计独特的产品功能。',
  '学习适应力': '指的是快速学习新知识的能力，例如适应新技术趋势。'
};
function calculateCompetencyScores(sessions: CompetencyScores[]): CompetencyResult {
  const competencyNames = Object.keys(COMPETENCY_MODEL);
  
  if (sessions.length === 0) {
    return Object.fromEntries(competencyNames.map(name => [name, 0]));
  }

  // 先计算原始分的平均值
  const avgScores: RawScores = {
    content_score: sessions.reduce((sum, s) => sum + s.content_score, 0) / sessions.length,
    logic_score: sessions.reduce((sum, s) => sum + s.logic_score, 0) / sessions.length,
    expression_score: sessions.reduce((sum, s) => sum + s.expression_score, 0) / sessions.length,
    overall_score: sessions.reduce((sum, s) => sum + s.overall_score, 0) / sessions.length,
  };

  // 再根据模型计算能力分
  const result: CompetencyResult = {};
  for (const name of competencyNames) {
    const model = COMPETENCY_MODEL[name];
    let score = 0;
    for (const key in model.dependencies) {
      const scoreKey = key as keyof RawScores;
      const weight = model.dependencies[scoreKey]!;
      score += (avgScores[scoreKey] || 0) * weight;
    }
    result[name] = Math.round(score);
  }
  return result;
}

/**
 * 生成成长洞察
 * @param current 当前能力得分
 * @param previous 上一阶段能力得分
 * @returns 洞察数组
 */
function generateGrowthInsights(current: CompetencyResult, previous: CompetencyResult): GrowthInsight[] {
  const insights: GrowthInsight[] = [];
  
  Object.keys(current).forEach(competency => {
    const currentScore = current[competency];
    const previousScore = previous[competency] ?? currentScore; // 修复：使用 ?? 运算符，正确处理0分的情况
    const change = currentScore - previousScore;
    const changePercentage = previousScore > 0 ? change / previousScore : (change > 0 ? 1 : 0);
    
    let status: 'progress' | 'stagnant' | 'decline';
    let description: string;
    
    if (changePercentage >= ANALYSIS_CONFIG.GROWTH_THRESHOLDS.SIGNIFICANT_PROGRESS) {
      status = 'progress';
      description = `显著提升！你在${competency}方面表现出色（${COMPETENCY_DESCRIPTIONS[competency]}）。继续保持这种进步势头。`;
    } else if (changePercentage >= ANALYSIS_CONFIG.GROWTH_THRESHOLDS.PROGRESS) {
      status = 'progress';
      description = `稳步提升。你在${competency}方面有所进步（${COMPETENCY_DESCRIPTIONS[competency]}）。建议继续加强练习。`;
    } else if (changePercentage <= ANALYSIS_CONFIG.GROWTH_THRESHOLDS.DECLINE) {
      status = 'decline';
      description = `需要关注。${competency}有所下降（${COMPETENCY_DESCRIPTIONS[competency]}）。建议重点练习相关技能。`;
    } else {
      status = 'stagnant';
      description = `保持稳定。${competency}维持在当前水平（${COMPETENCY_DESCRIPTIONS[competency]}）。可以尝试新的挑战来突破。`;
    }
    
    insights.push({
      competency,
      status,
      description,
      change: change > 0 ? `+${change}分` : `${change}分`
    });
  });
  
  return insights;
}

// --- API 路由处理 (重构) ---

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: "用户未认证" }, { status: 401 });
    }

    // 用户要求：获取全部历史数据来计算平均分
    const { data: sessions, error: sessionsError } = await supabase
      .from('practice_sessions')
      .select('content_score, logic_score, expression_score, overall_score, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (sessionsError) {
      console.error('获取练习数据失败:', sessionsError);
      return NextResponse.json({ error: "获取数据失败" }, { status: 500 });
    }

    if (!sessions || sessions.length === 0) {
      // 返回默认空状态数据
      const competencyNames = Object.keys(COMPETENCY_MODEL);
      const defaultResponse: CompetencyAnalysisResponse = {
        competencyData: competencyNames.map(name => ({ name, current: 0, previous: 0, historical: 0, fullMark: ANALYSIS_CONFIG.FULL_MARK })),
        growthInsights: [],
        lastScores: { content_score: 0, logic_score: 0, expression_score: 0, overall_score: 0 },
        historicalAverageScores: { content_score: 0, logic_score: 0, expression_score: 0, overall_score: 0 }
      };
      return NextResponse.json(defaultResponse);
    }

    // 计算最近一次得分
    const lastScores: RawScores = {
      content_score: sessions[0].content_score || 0,
      logic_score: sessions[0].logic_score || 0,
      expression_score: sessions[0].expression_score || 0,
      overall_score: sessions[0].overall_score || 0
    };

    // 计算历史平均分 (基于所有获取到的数据)
    const historicalAverageScores: RawScores = {
      content_score: Math.round(sessions.reduce((sum, s) => sum + (s.content_score || 0), 0) / sessions.length),
      logic_score: Math.round(sessions.reduce((sum, s) => sum + (s.logic_score || 0), 0) / sessions.length),
      expression_score: Math.round(sessions.reduce((sum, s) => sum + (s.expression_score || 0), 0) / sessions.length),
      overall_score: Math.round(sessions.reduce((sum, s) => sum + (s.overall_score || 0), 0) / sessions.length)
    };
    
    // -- 周期性能力计算 --
    const currentSessions = sessions.slice(0, ANALYSIS_CONFIG.CURRENT_PERIOD_SIZE);
    const currentCompetencyScores = calculateCompetencyScores(currentSessions);

    let previousCompetencyScores: CompetencyResult | null = null;
    let growthInsights: GrowthInsight[] = [];

    // 增加判断，只有在数据足够的情况下才进行对比
    const requiredSessionCountForComparison = ANALYSIS_CONFIG.CURRENT_PERIOD_SIZE + ANALYSIS_CONFIG.PREVIOUS_PERIOD_SIZE;
    if (sessions.length >= requiredSessionCountForComparison) {
        const previousSessions = sessions.slice(ANALYSIS_CONFIG.CURRENT_PERIOD_SIZE, requiredSessionCountForComparison);
        if(previousSessions.length >= ANALYSIS_CONFIG.MIN_SESSIONS_FOR_COMPARISON) {
            previousCompetencyScores = calculateCompetencyScores(previousSessions);
            growthInsights = generateGrowthInsights(currentCompetencyScores, previousCompetencyScores);
        }
    }

    // 构建能力数据
    const competencyData: CompetencyData[] = Object.keys(COMPETENCY_MODEL).map(name => ({
      name,
      current: currentCompetencyScores[name] || 0,
      previous: previousCompetencyScores?.[name] || 0,
      historical: calculateCompetencyScores(sessions)[name] || 0, // 历史平均基于本次获取的所有session
      fullMark: ANALYSIS_CONFIG.FULL_MARK
    }));

    const response: CompetencyAnalysisResponse = {
      competencyData,
      growthInsights,
      lastScores,
      historicalAverageScores
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('能力分析API错误:', error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
