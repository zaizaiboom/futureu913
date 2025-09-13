// 文件路径: app/api/evaluate-single/route.ts
// 职责：接收单题评估请求，并使用【服务角色】将其持久化到任务队列

import { NextResponse, type NextRequest } from "next/server";
import type { EvaluationRequest } from "@/types/evaluation";
// 关键改动：我们从 @supabase/supabase-js 导入 createClient
import { createClient } from "@supabase/supabase-js";

// 从环境变量中获取Supabase的URL和【服务角色密钥】
// 你需要在你的 .env.local 文件中添加 SUPABASE_SERVICE_ROLE_KEY
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const singleQuestionData: EvaluationRequest & { sessionId: string; questionIndex: number } = await request.json();

    if (!singleQuestionData.sessionId || singleQuestionData.questionIndex === undefined) {
      return NextResponse.json({ error: "请求缺少必要参数" }, { status: 400 });
    }
    
    // ======================= 核心修复点 =======================
    // 创建一个使用“服务角色密钥”的特殊Supabase客户端。
    // 这个客户端拥有超级管理员权限，可以绕过所有的RLS策略。
    // 这确保了我们的系统总能成功地将任务写入队列。
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
    // ==========================================================
    
    const { sessionId, questionIndex } = singleQuestionData;

    // 检查是否已存在相同的任务，避免重复插入
    const { data: existingTask } = await supabaseAdmin
        .from('evaluation_tasks')
        .select('id, status')
        .eq('session_id', sessionId)
        .eq('question_index', questionIndex)
        .single();

    if (existingTask) {
        console.log(`ℹ️ [API /evaluate-single] 任务已存在 (Session: ${sessionId}, Question: ${questionIndex}, Status: ${existingTask.status})`);
        return NextResponse.json({ 
            message: "评估任务已存在",
            sessionId: sessionId,
            status: existingTask.status
        }, { status: 200 });
    }

    // 将任务插入数据库队列
    const { error } = await supabaseAdmin.from('evaluation_tasks').insert({
        session_id: sessionId,
        question_index: questionIndex,
        status: 'pending'
    });

    if (error) {
        console.error("💥 [API /evaluate-single] 数据库插入任务失败:", error);
        // 将详细的数据库错误信息返回，方便调试
        return NextResponse.json({ error: "创建评估任务失败", details: error.message }, { status: 500 });
    }

    console.log(`✅ [API /evaluate-single] 任务已成功入队 (Session: ${sessionId}, Question: ${questionIndex})`);

    // 任务创建成功，可以安全地返回202响应
    return NextResponse.json({ 
        message: "评估任务已成功加入队列",
        sessionId: sessionId,
    }, { status: 202 });

  } catch (error) {
    console.error("💥 [API /evaluate-single] 请求处理错误:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}

// ===================================================================================
// 提醒：请确保你的 evaluation_tasks 表结构正确
// 你可以去Supabase后台的SQL Editor运行以下命令来添加或确认列是否存在
/*
  ALTER TABLE public.evaluation_tasks
  ADD COLUMN IF NOT EXISTS request_data JSONB;
*/
// ===================================================================================