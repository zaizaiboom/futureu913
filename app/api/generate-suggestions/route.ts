import { AIEvaluationService } from '../../../lib/ai-service';
import { CompetencyData } from '../../../types/competency';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const competencyData: CompetencyData[] = body.competencyData;

    if (!competencyData || !Array.isArray(competencyData) || competencyData.length === 0) {
      return new Response(JSON.stringify({ error: "缺少有效的competencyData" }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // 在运行时实例化AI服务
    const aiService = new AIEvaluationService();
    // 调用新的建议生成服务
    const suggestions = await aiService.generateSuggestions(competencyData);

    return new Response(JSON.stringify(suggestions), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error("💥 API /generate-suggestions 路由出错:", error);
    const errorMessage = error instanceof Error ? error.message : "未知错误";
    return new Response(JSON.stringify({ error: `处理请求时发生内部错误: ${errorMessage}` }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}