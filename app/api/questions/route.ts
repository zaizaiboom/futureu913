import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

import type { Question, QuestionCategory, InterviewStage } from '@/lib/questions-service'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  const supabase = await createClient()

  try {
    if (action === 'stages') {
      const { data, error } = await supabase.from('interview_stages').select('*').order('id')
      if (error) return NextResponse.json({ stages: [] })
      return NextResponse.json({ stages: data || [] })
    }

    if (action === 'categories') {
      const stageId = searchParams.get('stageId') ? parseInt(searchParams.get('stageId')!) : undefined
      let query = supabase.from('question_categories').select('*').order('id')
      if (stageId) query = query.eq('stage_id', stageId)
      const { data, error } = await query
      if (error) return NextResponse.json({ categories: [] })
      return NextResponse.json({ categories: data || [] })
    }

    if (action === 'random') {
      const stageId = parseInt(searchParams.get('stageId') || '0')
      const categoryId = searchParams.get('categoryId') ? parseInt(searchParams.get('categoryId')!) : undefined
      const count = parseInt(searchParams.get('count') || '5')
      let query = supabase.from('interview_questions').select('*').eq('stage_id', stageId)
      if (categoryId) query = query.eq('category_id', categoryId)
      const { data, error } = await query
      if (error) return NextResponse.json({ questions: [] })
      let questions = data || [];
      for (let i = questions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [questions[i], questions[j]] = [questions[j], questions[i]];
      }
      return NextResponse.json({ questions: questions.slice(0, count) })
    }

    if (action === 'randomByCategory') {
      const categoryId = parseInt(searchParams.get('categoryId') || '0')
      const count = parseInt(searchParams.get('count') || '2')
      const { data, error } = await supabase.from('interview_questions').select('*').eq('category_id', categoryId)
      if (error) return NextResponse.json({ questions: [] })
      let questions = data || [];
      for (let i = questions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [questions[i], questions[j]] = [questions[j], questions[i]];
      }
      return NextResponse.json({ questions: questions.slice(0, Math.min(count, questions.length)) })
    }

    if (action === 'randomCategoryQuestionsInOrder') {
      const stageId = parseInt(searchParams.get('stageId') || '0');
      console.log('[randomCategoryQuestionsInOrder] Received stageId:', stageId);

      // 1. Get all distinct category_ids from interview_questions for the given stageId
      const { data: questionCategoryIds, error: categoryIdsError } = await supabase
        .from('interview_questions')
        .select('category_id')
        .eq('stage_id', stageId);

      console.log('[randomCategoryQuestionsInOrder] Distinct category IDs query result:', { questionCategoryIds, categoryIdsError });

      if (categoryIdsError || !questionCategoryIds || questionCategoryIds.length === 0) {
        return NextResponse.json({ questions: [] });
      }

      const uniqueCategoryIds = [...new Set(questionCategoryIds.map(item => item.category_id))];
      console.log('[randomCategoryQuestionsInOrder] Unique category IDs:', uniqueCategoryIds);


      // 2. Pick a random categoryId
      const randomCategoryId = uniqueCategoryIds[Math.floor(Math.random() * uniqueCategoryIds.length)];
      console.log('[randomCategoryQuestionsInOrder] Randomly selected categoryId:', randomCategoryId);

      // 3. Fetch all questions for the selected category, in order
      const { data: questions, error: questionsError } = await supabase
        .from('interview_questions')
        .select('*')
        .eq('stage_id', stageId)
        .eq('category_id', randomCategoryId)
        .order('id', { ascending: true });

      console.log('[randomCategoryQuestionsInOrder] Questions query result:', { questions, questionsError });

      if (questionsError) {
        return NextResponse.json({ questions: [] });
      }

      return NextResponse.json({ questions: questions || [] });
    }

    if (action === 'questionsByStage') {
      const stageId = parseInt(searchParams.get('stageId') || '0')
      const { data, error } = await supabase.from('interview_questions').select('*').eq('stage_id', stageId).order('category_id', { ascending: true })
      if (error) return NextResponse.json({ questions: [] })
      return NextResponse.json({ questions: data || [] })
    }

    if (action === 'count') {
      const stageId = parseInt(searchParams.get('stageId') || '0')
      const categoryId = searchParams.get('categoryId') ? parseInt(searchParams.get('categoryId')!) : undefined
      let query = supabase.from('interview_questions').select('id', { count: 'exact' }).eq('stage_id', stageId)
      if (categoryId) query = query.eq('category_id', categoryId)
      const { count, error } = await query
      if (error) return NextResponse.json({ count: 0 })
      return NextResponse.json({ count: count || 0 })
    }

    if (action === 'stats') {
      const { count: totalQuestions } = await supabase.from('interview_questions').select('*', { count: 'exact', head: true })
      const { data: stageStats, error } = await supabase.from('interview_questions').select('stage_id, interview_stages!inner(stage_name)')
      if (error) return NextResponse.json({ totalQuestions: 0, questionsByStage: [] })
      const questionsByStage = stageStats?.reduce((acc: { stage_id: number; count: number; stage_name: string }[], item) => {
        const existing = acc.find(s => s.stage_id === item.stage_id)
        if (existing) {
          existing.count++
        } else {
          acc.push({ stage_id: item.stage_id, count: 1, stage_name: item.interview_stages?.[0]?.stage_name || '未知阶段' })
        }
        return acc
      }, []) || []
      return NextResponse.json({ totalQuestions: totalQuestions || 0, questionsByStage })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error in questions API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}