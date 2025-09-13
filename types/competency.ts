export interface Competency {
  id: string;
  // 能力的统一名称，例如："逻辑思维"
  name: string;

  // 定义了该能力从差到好的"光谱"或"等级"
  // 数组的顺序代表了从"待提升"到"优秀"
  spectrum: string[];
  // 例如: ['逻辑混乱', '逻辑跳跃', '逻辑基本连贯', '逻辑清晰', '逻辑严密']

  // 用户上一次评估时所处的状态
  previousState: string;
  // 例如: '逻辑基本连贯'

  // 用户本次评估所处的最新状态
  currentState: string;
  // 例如: '逻辑清晰'

  // AI对当前状态的简短文字诊断
  currentDiagnosis: string;
  // 例如: "在多数回答中能使用结构化方法，但在复杂问题时偶尔出现跳跃。"
}

export interface CompetencyData {
  name: string;
  current: number;
  previous: number;
  historical: number;
  fullMark: number;
}

// 示例数据
export const mockCompetencyData: Competency[] = [
  {
    id: 'logic',
    name: '逻辑思维',
    spectrum: ['逻辑混乱', '逻辑跳跃', '逻辑基本连贯', '逻辑清晰', '逻辑严密'],
    previousState: '逻辑基本连贯',
    currentState: '逻辑清晰',
    currentDiagnosis: '在多数回答中能使用结构化方法，但在复杂问题时偶尔出现跳跃。',
  },
  {
    id: 'relevance',
    name: '内容相关性',
    spectrum: ['完全跑题', '部分跑题', '紧扣主题', '表达极具相关性'],
    previousState: '表达极具相关性',
    currentState: '表达极具相关性',
    currentDiagnosis: '总能紧扣题目，并能有效引用案例来支撑观点。',
  },
  {
    id: 'example',
    name: '案例应用',
    spectrum: ['无案例', '案例不当', '案例运用不足', '案例详实有力'],
    previousState: '案例运用不足',
    currentState: '案例运用不足',
    currentDiagnosis: '提出了观点，但缺少具体的数据或个人经历作为证据。',
  },
  {
    id: 'communication',
    name: '表达能力',
    spectrum: ['表达不清', '表达基本清楚', '表达清晰', '表达生动有力'],
    previousState: '表达基本清楚',
    currentState: '表达清晰',
    currentDiagnosis: '能够清晰地传达观点，语言组织较好，但缺乏一些感染力。',
  },
  {
    id: 'innovation',
    name: '创新思维',
    spectrum: ['思维固化', '偶有新意', '思路开阔', '极具创新性'],
    previousState: '偶有新意',
    currentState: '思路开阔',
    currentDiagnosis: '能够从多个角度思考问题，提出了一些有价值的新观点。',
  }
];