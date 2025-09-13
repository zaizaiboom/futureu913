import { type NextRequest, NextResponse } from "next/server"
import { createClient } from '@/lib/supabase/server'

/**
 * 评估状态查询API - 支持渐进式呈现
 * 前端通过此API轮询已完成的评估结果
 */

// 使用 Supabase 代替内存存储

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    const type = searchParams.get('type') || 'single'

    if (!sessionId) {
      return NextResponse.json({ error: '缺少sessionId参数' }, { status: 400 })
    }

    if (type === 'single') {
      const { data: results, error } = await supabase
        .from('evaluation_tasks')
        .select('question_index, result, created_at, status')
        .eq('session_id', sessionId)
        .order('question_index', { ascending: true })

      if (error) throw error

      return NextResponse.json({
        sessionId,
        type: 'single',
        results: results.map(r => ({
          questionIndex: r.question_index,
          result: r.result,
          timestamp: r.created_at,
          status: r.status
        })),
        count: results.length,
        timestamp: new Date().toISOString()
      })
    }

    if (type === 'summary') {
      // 对于summary，我们可以复用同一张表，或单独处理
      // 这里假设summary也存入evaluation_tasks，以question_index = -1 表示summary
      const { data, error } = await supabase
        .from('evaluation_tasks')
        .select('status, result, error_message, updated_at')
        .eq('session_id', sessionId)
        .eq('question_index', -1)
        .single()

      if (error) throw error
      if (!data) {
        return NextResponse.json({
          sessionId,
          type: 'summary',
          status: 'pending',
          timestamp: new Date().toISOString()
        })
      }

      return NextResponse.json({
        sessionId,
        type: 'summary',
        status: data.status,
        result: data.result,
        error: data.error_message,
        timestamp: data.updated_at
      })
    }

    return NextResponse.json({ error: '不支持的查询类型' }, { status: 400 })
  } catch (error) {
    console.error('💥 [评估状态API] 查询失败:', error)
    return NextResponse.json({
      error: '状态查询失败',
      message: error instanceof Error ? error.message : '未知错误',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { sessionId, questionIndex, result, type = 'single', errorMessage } = body

    if (!sessionId || questionIndex === undefined) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 })
    }

    const status = result ? 'completed' : (errorMessage ? 'failed' : 'pending')

    const { error } = await supabase
      .from('evaluation_tasks')
      .upsert({
        session_id: sessionId,
        question_index: type === 'summary' ? -1 : questionIndex,
        status,
        result,
        error_message: errorMessage,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'session_id, question_index'
      })

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: `${type}评估结果已存储`,
      sessionId,
      questionIndex,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('💥 [评估状态API] 存储失败:', error)
    return NextResponse.json({
      error: '结果存储失败',
      message: error instanceof Error ? error.message : '未知错误',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// 注意：清理过期数据的功能应该通过 Supabase 的 cron job 或 trigger 实现
// 而不是在 API 路由中使用 setInterval