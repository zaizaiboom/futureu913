const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://jxsewcsxhiycofydtxhi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4c2V3Y3N4aGl5Y29meWR0eGhpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDM5NDY0NywiZXhwIjoyMDY5OTcwNjQ3fQ.u7lqk_b5lAg9hiruiYzU3g-qSLnfu2Ox-F4v7q4Zotg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestData() {
  try {
    console.log('🚀 开始创建测试数据...');
    
    // 生成测试用的session_id
    const sessionId = crypto.randomUUID();
    
    // 创建示例学习报告
    const learningReport = {
      overallSummary: {
        overallLevel: "良好表现",
        summary: "你在AI产品经理面试中展现了良好的基础素养和专业认知，在逻辑思维和表达能力方面表现突出。",
        strengths: [
          {
            competency: "逻辑思维",
            description: "回答结构清晰，能够按照逻辑顺序组织内容，体现了良好的分析能力。"
          },
          {
            competency: "专业认知",
            description: "对AI产品经理角色有较好的理解，能够结合实际案例进行分析。"
          }
        ],
        improvements: [
          {
            competency: "深度分析",
            suggestion: "建议在回答中加入更多具体的数据支撑和案例分析。",
            example: "可以引用具体的产品数据或市场调研结果来支撑观点。"
          }
        ]
      },
      individualEvaluations: [
        {
          questionContent: "经过前面几轮面试，现在你对咱们公司和这个岗位应该有更深的了解了吧？跟我说说你现在的理解呗，还有最吸引你的点是啥，以及让你觉得有挑战的点又是什么？",
          performanceLevel: "良好表现",
          summary: "回答展现了对公司和岗位的深入思考，能够识别关键吸引点和挑战。"
        },
        {
          questionContent: "跟我分享个例子呗，比如你主动做了超出自己职责范围的工作，最后还取得了不错的结果，这种经历有吗？",
          performanceLevel: "优秀表现",
          summary: "提供了具体的实例，展现了主动性和跨部门协调能力。"
        }
      ],
      stageInfo: {
        stageType: "ai_product_manager",
        stageTitle: "AI产品经理面试",
        questionCount: 2
      },
      timestamp: new Date().toISOString()
    };
    
    // 创建测试练习记录
    const testRecords = [
      {
        user_id: 'ddc5bbea-54be-4c7b-9b6d-ea77d6dc9664', // 真实用户ID
        question_id: 244, // 使用真实的问题ID
        stage_id: null,
        category_id: null,
        user_answer: "经过前面几轮面试，我对公司的AI产品战略和这个岗位有了更深的理解。最吸引我的是公司在AI技术应用方面的创新能力和对用户体验的重视。挑战在于如何平衡技术可行性和商业价值。",
        overall_score: 85,
        content_score: 80,
        logic_score: 90,
        expression_score: 85,
        ai_feedback: "回答结构清晰，对公司和岗位理解准确，建议加入更多具体的技术理解。",
        practice_duration: 120,
        session_id: sessionId,
        learning_report: learningReport
      },
      {
        user_id: 'ddc5bbea-54be-4c7b-9b6d-ea77d6dc9664',
        question_id: 245, // 使用真实的问题ID
        stage_id: null,
        category_id: null,
        user_answer: "在之前的项目中，我主动承担了跨部门协调的工作，虽然不在我的直接职责范围内，但我发现这对项目成功至关重要。通过建立有效的沟通机制，最终项目提前完成并超出预期效果。",
        overall_score: 92,
        content_score: 95,
        logic_score: 90,
        expression_score: 90,
        ai_feedback: "回答全面且有条理，展现了优秀的主动性和协调能力。",
        practice_duration: 180,
        session_id: sessionId,
        learning_report: learningReport
      }
    ];
    
    // 插入测试数据
    const { data, error } = await supabase
      .from('practice_sessions')
      .insert(testRecords)
      .select();
    
    if (error) {
      console.error('❌ 插入数据失败:', error);
      return;
    }
    
    console.log('✅ 测试数据创建成功!');
    console.log('📊 创建的记录:', data);
    console.log('🔗 Session ID:', sessionId);
    console.log('🌐 可以访问详情页面: http://localhost:3000/practice-history/' + data[0].id);
    
  } catch (error) {
    console.error('💥 创建测试数据失败:', error);
  }
}

// 运行测试数据创建
createTestData();