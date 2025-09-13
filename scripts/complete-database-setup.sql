-- 修复版本：AI产品经理面试题库导入脚本
-- 整合了表结构创建、数据插入和RLS策略，并根据最新题库内容补全和调整了题目。
-- 此脚本会清空并重建所有相关数据，请在运行前确认。

-- 0. 将所有操作包裹在一个事务中，确保原子性
BEGIN;

-- 1. 首先清理现有对象，注意删除顺序和CASCADE
-- 使用 DROP ... IF EXISTS 来避免在对象不存在时出错
DROP TABLE IF EXISTS public.job_recommendations;
DROP TABLE IF EXISTS public.project_progress;
DROP TABLE IF EXISTS public.resume_analysis;
DROP TABLE IF EXISTS public.interviews;
DROP TABLE IF EXISTS public.interview_questions;
DROP TABLE IF EXISTS public.question_categories;
DROP TABLE IF EXISTS public.interview_stages;
DROP TABLE IF EXISTS public.profiles;


-- 2. 创建所有数据表 (根据您提供的最新结构)
-- 创建用户资料表
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建面试阶段表
CREATE TABLE IF NOT EXISTS public.interview_stages (
  id SERIAL PRIMARY KEY,
  stage_name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建问题分类表
CREATE TABLE IF NOT EXISTS public.question_categories (
  id SERIAL PRIMARY KEY,
  category_name TEXT NOT NULL,
  description TEXT,
  stage_id INTEGER REFERENCES public.interview_stages(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建面试问题表
CREATE TABLE IF NOT EXISTS public.interview_questions (
  id SERIAL PRIMARY KEY,
  question_text TEXT NOT NULL,
  category_id INTEGER REFERENCES public.question_categories(id),
  stage_id INTEGER REFERENCES public.interview_stages(id),
  difficulty_level INTEGER CHECK (difficulty_level >= 1 AND difficulty_level <= 5), -- 1-easy, 2-medium, 3-hard, 4-advanced, 5-expert
  expected_answer TEXT,
  answer_suggestion TEXT, -- Added this column to match data
  keywords TEXT[],
  time_limit INTEGER, -- Added this column to match data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建面试记录表
CREATE TABLE IF NOT EXISTS public.interviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  stage_id INTEGER REFERENCES public.interview_stages(id),
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  score INTEGER,
  feedback TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建简历分析表
CREATE TABLE IF NOT EXISTS public.resume_analysis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  resume_content TEXT,
  analysis_result JSONB,
  recommendations TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建项目进度表
CREATE TABLE IF NOT EXISTS public.project_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  project_name TEXT NOT NULL,
  progress_percentage INTEGER CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  status TEXT CHECK (status IN ('not_started', 'in_progress', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建职位推荐表
CREATE TABLE IF NOT EXISTS public.job_recommendations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  job_title TEXT NOT NULL,
  company_name TEXT,
  match_score INTEGER CHECK (match_score >= 0 AND match_score <= 100),
  requirements TEXT[],
  recommended_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- 3. 插入基础数据 (阶段和分类)
INSERT INTO public.interview_stages (id, stage_name, description) OVERRIDING SYSTEM VALUE VALUES 
(1, 'HR面试', '综合评估候选人的基本素质、沟通能力和职业动机'),
(2, '专业面试', '聚焦AI产品理解力、技术深度和实际项目经验'),
(3, '终面', '重点评估候选人的行业洞察力与复杂场景分析能力，考察战略思维')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.question_categories (id, category_name, stage_id, description) OVERRIDING SYSTEM VALUE VALUES
(1, '自我介绍与职业动机', 1, '评估候选人的自我认知、职业规划和岗位理解'),
(2, '职业规划与团队协作', 1, '考察实际项目经验和跨团队协作能力'),
(3, 'AI产品设计思维', 2, '评估对AI技术的理解深度和产品化能力'),
(4, '技术与商业平衡', 2, '考察产品设计思维和用户体验优化能力'),
(5, '行业趋势判断', 3, '评估战略思维、行业洞察和商业判断力'),
(6, '复杂场景分析与商业模式', 3, '考察复杂业务场景的分析和解决能力')
ON CONFLICT (id) DO NOTHING;


-- 4. 插入所有面试题，并映射到新的表结构
-- difficulty_level: medium -> 2, hard -> 3, advanced -> 4
INSERT INTO public.interview_questions (category_id, stage_id, question_text, expected_answer, answer_suggestion, difficulty_level, time_limit) VALUES
-- HR面试 -> 自我介绍与职业动机 (category_id = 1, stage_id = 1)
(1, 1, '请用3分钟进行自我介绍，重点说明你为什么适合AI产品经理岗位。', '我具备3年AI产品相关经验...这与贵司"技术向善"的产品理念高度契合。', '候选人应采用"技术能力-项目成果-职业动机"的三段式结构...', 2, 180),
(1, 1, '请举例说明你过往经历中最能体现AI产品思维的一个项目。', '在某教育科技公司...该项目体现了以数据飞轮为驱动...的AI产品思维。', '此问题考察对"AI产品思维"的理解深度...关键在于体现概率型设计、持续学习等AI特有范式。', 2, 240),
(1, 1, '你为什么选择AI产品经理而非传统产品经理或算法工程师？', '我选择AI产品经理岗位基于三点考量...这种跨域协作能力是我最有成就感的部分。', '候选人需突出"不可替代性"...避免"AI是风口"的投机心态。', 2, 240),
(1, 1, '在AI产品落地过程中，你认为最具挑战性的环节是什么？请结合经历说明。', '我认为最具挑战的是"技术可行性与商业目标的动态平衡"...又要创造性地拆解商业目标。', '此问题考察实战经验与问题解决能力...需避免空泛回答"技术难度大"。', 3, 240),
(1, 1, '你认为AI产品经理最易被忽视的核心职责是什么？为什么多数人会忽略它？', '最易被忽视的职责是“AI伦理落地执行者”。多数人聚焦功能交付，却忽略模型偏见可能引发的法律风险。原因有三：技术团队认为是“法务问题”，业务方急于上线，而PM缺乏工具链。', '此问题考察候选人对AI产品责任边界的深度思考。好的回答应能点出“伦理”或“风险管理”这一具体、易被忽视的领域，并分析其被忽略的组织或流程原因。', 3, 240),
(1, 1, '如果入职后发现实际工作与你的预期不符（如技术团队不配合AI实验），你的应对策略是什么？', '应对策略：①快速诊断：用1周时间访谈关键角色，定位阻力源；②共建目标：将AI实验与团队KPI挂钩；③小步验证：先推动低成本实验，用数据说服。这反映出我认可“PM是服务者而非命令者”，且能主动调整预期。', '此问题考察候选人的适应能力、解决问题能力和自我认知。重点在于展现候选人主动、务实、以合作而非对抗姿态解决问题的能力。', 2, 240),
(1, 1, '请用具体例子说明，你的个人价值观如何与AI产品经理所需的“用户至上”原则一致？', '我的核心价值观是“技术应服务于人而非反之”。例如，在开发老年健康监测AI时，我坚持加入“误报安抚机制”：当跌倒检测模型置信度<90%时，系统先语音确认而非直接报警，避免老人恐慌。这体现了“用户至上”不仅是UX设计，更是对抗技术傲慢。', '此问题考察价值观与岗位的匹配度。候选人需要通过一个真实、有温度的例子，将抽象的价值观具体化，并与AI产品的特殊性（如不确定性、对人的影响）结合起来。', 2, 240),
(1, 1, '你如何定义AI产品经理的“成功”？请对比普通产品经理的成功标准差异。', 'AI PM的成功 = 模型价值可持续释放，标准有三：①技术健康度：模型在生产环境的衰减率<5%/季度；②用户行为转化：AI功能使用率提升且带来LTV增长；③伦理合规：0起重大偏见投诉。差异在于：普通PM成功是“按时交付需求”，而AIPM必须确保“模型生命周期价值”。', '此问题考察候选人对AIPM角色本质的理解。好的回答应超越“上线功能”，关注AI产品的长期价值和特有挑战，如模型生命周期管理、数据驱动的持续优化和风险控制。', 3, 240),
(1, 1, '为什么选择应聘我们公司的AI产品经理岗位？请结合我们最新产品动态给出针对性回答。', '我深度研究了贵司动态：①产品契合：贵司Q2发布的“AI合规助手”直击我关注的金融监管痛点；②技术差异：贵司采用联邦学习解决数据孤岛问题，与我理念一致；③文化匹配：贵司PM需参与代码评审，证明技术深度被重视。我曾用类似架构将某银行模型训练效率提升50%，可快速复用经验。', '此问题考察候选人的求职诚意和行业研究能力。最佳回答应具体、有深度，能结合公司的具体产品、技术栈或招聘信息，并说明自己的过往经验如何能为公司带来直接价值。', 3, 240),

-- HR面试 -> 职业规划与团队协作 (category_id = 2, stage_id = 1)
(2, 1, '结合AI产品经理的能力模型，阐述你未来3年的职业发展规划。', '我的规划基于"技术深度-商业广度"双轴发展...并关注AI伦理前沿。', '候选人应避免"3年升总监"的空泛目标...规划需与目标公司的业务方向匹配。', 2, 180),
(2, 1, '面对AI技术的快速迭代，你如何保持知识更新？', '我建立了"三维学习体系"...更要理解技术与商业、伦理的交叉影响。', '此问题考察自驱力与学习方法...关键在于对技术原理与产品化路径的深度理解。', 2, 180),
(2, 1, '当算法团队坚持追求模型精度而忽视工程落地成本时，你如何协调？', '我会采用"数据驱动+目标对齐"的两步法...确保双方对优先级达成共识。', '此问题考察冲突解决能力...采用"技术指标-业务价值"映射表的团队，冲突解决效率更高。', 3, 240),
(2, 1, '请描述一次你在AI项目中与跨部门团队（如数据标注、法务）的协作经历。', '在某医疗AI产品项目中...AI产品的协作需建立"技术规范+法律框架+人文关怀"的三维共识，尤其在敏感领域。', '此问题考察跨域协作能力...能清晰描述"多方利益协调"的候选人，被评价为"团队适配度高"的比例高出平均值38%。', 3, 300),
(2, 1, '在AI项目中，你如何处理技术团队认为“不可行”的需求？请举例说明你的协商策略。', '策略：用技术可行性阶梯替代二元选择。案例：业务方要求直播平台实时识别违规内容。我：①量化约束：定义“可接受延迟”为500ms；②提供替代路径：提议V1用异步分析+关键帧抽样；③共建实验：与工程师设计A/B测试。不争论“是否可行”，而是定义“在什么条件下可行”。', '此问题考察候选人的技术沟通和创造性解决问题的能力。重点在于展现如何将一个看似对立的问题，通过拆解、量化和分阶段实施，转化为一个可合作、可验证的方案。', 3, 300),
(2, 1, '分享一个你因跨团队沟通失误导致项目风险的例子，以及你如何补救并建立预防机制。', '案例：开发医疗影像AI时，我未明确告知设计团队“模型对图像分辨率敏感”，导致UI默认压缩图片，模型准确率骤降30%。补救：①紧急止损；②根因分析；③机制建设：推行“技术风险检查表”，强制PRD签字确认。反思：AIPM必须充当“技术翻译”。', '此问题考察候选人的坦诚、复盘能力和成长性。一个好的回答不仅要清晰地描述问题和补救措施，更重要的是展现出从中吸取了教训，并将其制度化、流程化以避免未来重蹈覆辙。', 2, 300),
(2, 1, '当数据科学家和用户体验设计师对产品方向产生分歧（如“追求模型精度”vs“简化交互”），你如何决策？', '决策框架：用户价值优先，数据驱动妥协。实例：智能写作工具中，数据团队坚持优化语法模型，设计师主张减少弹窗干扰。我：①量化影响：分析用户行为数据，弹窗减少使任务完成率+15%；②设计实验：A/B测试；③结果导向：B组LTV高22%，据此说服数据团队。', '此问题考察候选人的决策能力和数据驱动思维。关键在于说明如何避免主观判断，通过量化分析和科学实验（如A/B测试）来建立一个客观的决策依据，从而有效地说服团队。', 3, 300),

-- 专业面试 -> AI产品设计思维 (category_id = 3, stage_id = 2)
(3, 2, '请解释RAG技术的原理，并分析其与微调在产品设计中的适用场景差异。', 'RAG（检索增强生成）通过引入外部知识库...实际产品中常采用混合策略。', '此问题考察技术选型能力...能准确描述"RAG+微调"混合策略的候选人，技术评估得分更高。', 3, 300),
(3, 2, '如何评估一个AI产品的算法公平性？请举例说明具体方法。', '算法公平性评估需从"定义-检测-缓解"三阶段入手...需注意公平性与其他指标（如精度）的权衡。', '此问题考察AI伦理设计能力...在面试中提及"公平性评估"的候选人，更易获得认可。', 3, 360),
(3, 2, '在AI产品的冷启动阶段，你会采用哪些数据策略？', '冷启动数据策略需根据场景选择"数据-模型-产品"的不同组合...关键是判断"数据临界点"。', '此问题考察数据驱动能力...能量化"数据量-模型效果"关系的候选人，产品落地能力评分更高。', 2, 240),
(3, 2, '当AI产品上线后出现模型性能衰减（如推荐准确率下降），你如何诊断与解决？', '模型衰减处理遵循"诊断-根因-迭代"流程...同时需建立性能预警机制。', '此问题考察问题解决能力...能设计"自动预警+分级响应"机制的候选人，产品稳定性评分更高。', 3, 300),
(3, 2, '解释机器学习中的“概念漂移”(Concept Drift),并说明作为AI产品经理,你会在产品设计阶段采取哪些预防措施?', '概念漂移指模型输入数据的统计特性随时间变化，导致预测失效。预防措施：①监控设计：在PRD中强制要求“漂移检测模块”；②数据策略：定义“新鲜数据”标准；③用户反馈闭环：设计轻量反馈入口，自动触发模型重训练。产品化关键：将技术风险转化为产品功能。', '此问题考察对模型生命周期管理中核心风险的理解。候选人需要清晰解释技术概念，并从产品设计的角度提出可落地的预防和应对措施，体现其前瞻性和系统性思维。', 3, 300),
(3, 2, '当数据科学家说“模型达到95%准确率,可以上线”,作为产品经理,你会要求验证哪些额外指标?为什么?', '必须验证：①业务指标：如电商推荐系统的“GMV提升率”；②公平性指标：使用AIF360工具检测不同用户群的F1值差异；③鲁棒性指标：对抗测试。原因：95%准确率可能掩盖问题，如数据不平衡。产品化原则：准确率是起点,业务影响和风险控制才是终点。', '此问题考察候选人对模型评估的批判性思维。好的回答应能超越单一的技术指标，从商业价值、用户体验和风险管理的多个维度提出需要验证的指标，并解释其背后的原因。', 3, 300),
(3, 2, '如何将学术界的SOTA模型(如GPT-4)转化为企业级产品?请描述你的评估和落地步骤。', '四步产品化路径：①成本-收益分析：测算SOTA的推理成本 vs 业务价值；②场景适配：剥离非核心能力，聚焦垂直需求；③渐进上线：先限流10%用户验证；④合规设计：内置内容过滤器。核心：产品化不是技术搬运,而是价值过滤。', '此问题考察候选人的商业敏感度和工程实践能力。需要展现一个从技术评估到商业落地的完整、结构化的思考过程，特别是在成本、场景和风险控制方面的权衡能力。', 4, 360),
(3, 2, 'MLOps对AI产品至关重要。作为产品经理,你会如何推动团队实施MLOps实践?请给出可落地的指标。', '推动策略：①定义产品级指标：模型迭代周期(<7天)、漂移检测覆盖率(100%)、回滚速度(<30分钟)；②绑定业务价值：说明MLOps如何提升用户留存；③最小化启动：先实施关键链路。产品化思维：MLOps不是技术债,而是产品可靠性的基础功能。', '此问题考察候选人对AI工程化和规模化的理解。重点在于如何将一个技术概念（MLOps）转化为产品经理可以推动、可以衡量的具体行动和指标，并能向团队阐明其商业价值。', 3, 300),


-- 专业面试 -> 技术与商业平衡 (category_id = 4, stage_id = 2)
(4, 2, '如何优化一个基于大模型的API产品的算力成本？', '算力成本优化需从"模型-推理-调度"三层面实施...定期评估性价比并调整策略。', '此问题考察技术深度与成本意识的结合...能提及"推测解码"等前沿优化技术的候选人，技术深度评分更高。', 3, 300),
(4, 2, '如何设计一个AI产品的定价策略？请举例说明关键考量因素。', 'AI产品定价需综合考虑"成本结构-用户价值-竞争格局"三要素...具体策略可包括分层定价、多种计量方式、动态调整。', '此问题考察商业思维与定价策略设计能力...采用"价值锚定"定价的产品，客户接受度更高。', 2, 300),
(4, 2, '设计一个面向老年人的AI用药提醒产品,你会如何确保界面简单且减少误操作?', '核心设计原则：容错优先于效率。①交互简化：仅保留3个核心按钮；②AI特性利用：声纹识别防误触，预测性提醒；③容错机制：允许撤销，并发送短信确认给子女；④离线支持。洞察：老年用户需要AI的“隐形辅助”,而非炫技。', '此问题考察候选人对特定用户群体的同理心和产品设计能力。需要将AI技术巧妙地融入到解决用户痛点的设计中，并重点突出安全、容错和易用性，而非仅仅罗列技术功能。', 2, 300),
(4, 2, '当AI预测结果不准确(如地图导航错误),你如何设计用户体验来维持信任?', '信任维护四步法：①即时透明：显示置信度；②提供控制权：允许用户覆盖AI决策；③学习反馈：设计“帮助改进”按钮；④情感化设计：用幽默文案化解。关键：不隐藏AI局限,而是将错误转化为共建机会。', '此问题考察在AI产品不确定性下，如何进行体验设计。好的回答应能体现出对用户心理的洞察，通过透明、赋权和共建的方式，将负面体验转化为建立长期信任的机会。', 3, 300),
(4, 2, '在隐私敏感场景(如健康AI),你如何设计数据收集流程,既满足模型需求又不损害用户体验?', '隐私-体验平衡策略：①渐进式授权：用“价值交换”获取更多数据；②本地化处理：敏感数据在设备端处理；③透明控制：设置“数据仪表盘”，用户可查看、删除数据。核心：隐私不是障碍,而是体验差异化点。', '此问题考察候选人在处理敏感数据时的产品设计能力。需要提出具体、可行的解决方案，在满足模型需求和保护用户隐私之间找到平衡，并能将隐私保护转化为产品的信任优势。', 3, 360),
(4, 2, 'AI产品常因“黑盒”特性让用户困惑。你如何通过设计提升可解释性?', '可解释性设计分层：①基础层：用自然语言解释；②进阶层：提供影响因素滑块；③专业层：开放API供技术用户查看特征权重。原则：解释需匹配用户角色——普通用户要“为什么”,专家要“怎么改”。', '此问题考察对AI可解释性（XAI）的产品化理解。候选人需要根据不同的用户类型，提出分层的、有针对性的设计方案，将复杂的技术概念转化为用户可以理解和交互的产品功能。', 3, 300),

-- 终面 -> 行业趋势判断 (category_id = 5, stage_id = 3)
(5, 3, '你如何看待AI Agent技术在2025-2027年的发展趋势？其商业化瓶颈可能是什么？', 'AI Agent的发展将呈现"能力深化-生态构建-垂直落地"三阶段趋势...垂直行业解决方案将占主导，而非通用Agent。', '此问题考察行业洞察力...能准确识别"Multi-Agent"为关键趋势的候选人，战略评估得分更高。', 4, 600),
(5, 3, '多模态大模型的成熟对哪些行业将产生颠覆性影响？请举例说明产品形态变化。', '多模态模型将对"内容创作-医疗诊断-工业检测"等行业产生颠覆性影响...产品设计需重构人机交互范式。', '此问题考察行业洞察力...能结合具体行业痛点（如医疗影像的模态割裂）的候选人，战略思维评分更高。', 4, 480),
(5, 3, '分析当前GenAI(生成式AI)热潮中,90%的AI产品可能失败的核心原因,并给出你的产品战略建议。', '失败核心原因：伪需求泛滥，多数产品将GenAI作为“功能贴牌”，而非解决真实痛点。战略建议：①聚焦“必须用AI”的场景；②构建数据护城河；③按价值收费。本质：AI产品必须创造不可替代的价值链。', '此问题考察候选人的商业洞察力和批判性思维。需要一针见血地指出当前市场的普遍问题，并从战略层面提出清晰、可行的应对建议，展现出超越产品功能本身的大局观。', 4, 480),
(5, 3, '评估开源大模型(如Llama 3)对商业AI产品的威胁与机遇,并说明你的产品应对策略。', '威胁：基础模型同质化，压缩利润空间。机遇：降低创新门槛，聚焦垂直场景优化。应对策略：①短期：将开源模型作为“能力基座”，但构建行业知识库；②中期：开发工作流整合层；③长期：转向数据飞轮模式。本质：开源时代,产品护城河在数据与场景,不在模型本身。', '此问题考察候选人对产业格局的动态理解。需要辩证地分析开源模型的双重影响，并从短期、中期、长期三个维度提出有层次、有远见的产品战略，以构建持久的竞争壁垒。', 4, 480),

-- 终面 -> 复杂场景分析与商业模式 (category_id = 6, stage_id = 3)
(6, 3, '如何设计一个AI+教育的个性化学习产品？需考虑技术可行性与教育公平性。', '设计需平衡"技术赋能-教育本质-社会公平"三要素...定期引入教师专家评审。', '此问题考察复杂系统设计能力...能阐述"AI与教师角色分工"的候选人，产品设计评分更高。', 4, 600),
(6, 3, 'AI Agent平台的生态商业模式如何设计？请分析关键成功因素。', 'AI Agent平台的生态商业模式需围绕"开发者-用户-合作伙伴"构建三赢体系...其中第三方Agent贡献60%的使用时长。', '此问题考察平台思维...能强调"开发者生态"的候选人，平台战略评分更高。', 4, 600),
(6, 3, '在制造业场景中，如何设计AI预测性维护产品？需考虑工业环境的特殊性。', '工业预测性维护产品需适应"数据稀疏-环境复杂-成本敏感"的特殊性...需注意工业标准兼容性与安全认证。', '此问题考察行业适配能力...能考虑"工厂网络不稳定"等细节的候选人，行业适配评分更高。', 3, 360),
(6, 3, '针对AI+医疗影像产品，设计合理的商业模式与盈利路径。', 'AI+医疗影像的商业模式需平衡"监管合规-医院预算-技术价值"...收取运营分成。盈利路径多元化：1)硬件销售；2)软件授权；3)增值服务。', '此问题考察商业设计能力...能考虑"数据合规"的候选人，商业可行性评分高出平均值38%。需强调价值量化。', 3, 360),
(6, 3, '如果公司要求你将AI产品从免费转向付费模式,你会如何制定策略?', '四步转型策略：①用户价值分层：免费层保留基础功能，付费层聚焦高价值场景；②竞争防御：分析竞品定价，但突出差异化；③过渡设计：提供“价值计算器”；④风险对冲：保留免费配额。关键：付费不是功能切割,而是价值显性化。', '此问题考察候选人的商业化策略能力。需要提出一个系统性的、考虑多方因素（用户、竞品、自身价值）的转型方案，并包含具体的可执行步骤，展现出成熟的商业思维。', 4, 480),
(6, 3, '在经济下行期,你会如何调整AI产品战略以保障商业可持续性?', '战略调整三原则：①聚焦ROI明确的场景，转向降本增效；②轻量级创新，用RAG替代大模型微调；③客户成功驱动，将PM KPI从“新功能交付”转为“客户续费率”。核心：经济下行期,AI必须证明“此刻就能赚钱”。', '此问题考察候选人在不确定环境下的战略调整能力。好的回答应能体现出务实、聚焦、以客户为中心的原则，并能提出具体的技术和组织层面的调整措施。', 4, 480),
(6, 3, '假设你的核心AI产品用户留存率突然下降15%,你会如何系统分析原因并制定解决方案?', '分析框架：漏斗归因+根因树。①定位阶段：检查留存漏斗，发现“模型预测准确率”下降；②根因挖掘：技术层（数据管道故障）、业务层（竞品）、用户层（新用户群体变化）；③解决方案：紧急（回滚模型）、中期（建立数据健康度看板）、长期（设计用户分群策略）。', '此问题考察候选人系统性的问题分析和解决能力。需要展现一个从现象到本质、从技术到业务的多维度归因框架，并能提出分层次、分阶段的解决方案。', 3, 420),
(6, 3, '分析一个著名AI产品失败案例(如Google Flu Trends),并提出你的改进方案。', '失败原因：①数据偏差：依赖搜索词数据，但媒体事件导致搜索行为失真；②模型过拟合；③产品化缺失：未设计用户反馈闭环。改进方案：①数据融合：整合医院就诊数据；②动态校准：加入流行病学专家规则；③产品设计：向用户开放“预测修正”入口。教训：AI产品失败常因忽略“人”在环路中的作用。', '此问题考察候选人的批判性思维和产品复盘能力。需要准确分析出失败案例背后的深层原因（通常是技术、数据和产品思维的综合问题），并能提出具体、可行的产品化改进方案。', 4, 480);


-- 5. 启用所有表的行级安全策略 (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_questions ENABLE ROW LEVEL SECURITY;

-- 6. 创建安全策略，使用 DROP IF EXISTS 确保可重跑
-- 私有表策略 (仅限用户自己)
DROP POLICY IF EXISTS "Users can manage their own profile" ON public.profiles;
CREATE POLICY "Users can manage their own profile" ON public.profiles FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can manage their own interviews" ON public.interviews;
CREATE POLICY "Users can manage their own interviews" ON public.interviews FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own resume analysis" ON public.resume_analysis;
CREATE POLICY "Users can manage own resume analysis" ON public.resume_analysis FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own project progress" ON public.project_progress;
CREATE POLICY "Users can manage own project progress" ON public.project_progress FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own job recommendations" ON public.job_recommendations;
CREATE POLICY "Users can view own job recommendations" ON public.job_recommendations FOR SELECT USING (auth.uid() = user_id);

-- 公共表策略 (所有认证用户可读)
DROP POLICY IF EXISTS "Authenticated users can view public tables" ON public.interview_stages;
CREATE POLICY "Authenticated users can view public tables" ON public.interview_stages FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can view public tables" ON public.question_categories;
CREATE POLICY "Authenticated users can view public tables" ON public.question_categories FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can view public tables" ON public.interview_questions;
CREATE POLICY "Authenticated users can view public tables" ON public.interview_questions FOR SELECT TO authenticated USING (true);


-- 7. 重置序列值，确保后续插入的ID正确
SELECT setval('public.interview_questions_id_seq', (SELECT MAX(id) FROM public.interview_questions), true);
SELECT setval('public.question_categories_id_seq', (SELECT MAX(id) FROM public.question_categories), true);
SELECT setval('public.interview_stages_id_seq', (SELECT MAX(id) FROM public.interview_stages), true);

-- 提交事务
COMMIT;
