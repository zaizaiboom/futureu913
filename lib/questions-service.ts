// import { supabase } from "./supabase/client"

export interface Question {
  id: number
  question_text: string
  category_id: number
  stage_id: number
  difficulty_level: string
  expected_answer: string
  keywords: string[]
  answer_suggestion: string
}

export interface QuestionCategory {
  id: number
  category_name: string
  stage_id: number
  description: string
}

export interface InterviewStage {
  id: number
  stage_name: string
  description: string
}

// 获取所有面试阶段
export async function getInterviewStages(): Promise<InterviewStage[]> {
  try {
    const response = await fetch('/api/questions?action=stages')
    if (!response.ok) throw new Error('Failed to fetch stages')
    const { stages } = await response.json()
    return stages || []
  } catch (error) {
    console.error('Error fetching interview stages:', error)
    return []
  }
}

// 根据阶段获取问题分类
export async function getQuestionCategories(stageId?: number): Promise<QuestionCategory[]> {
  try {
    const url = new URL('/api/questions', window.location.origin)
    url.searchParams.set('action', 'categories')
    if (stageId) url.searchParams.set('stageId', stageId.toString())
    const response = await fetch(url.toString())
    if (!response.ok) throw new Error('Failed to fetch categories')
    const { categories } = await response.json()
    return categories || []
  } catch (error) {
    console.error('Error fetching question categories:', error)
    return []
  }
}

// 根据阶段随机获取问题
export async function getRandomQuestions(
  stageId: number,
  categoryId?: number,
  count: number = 5
): Promise<Question[]> {
  try {
    const url = new URL('/api/questions', window.location.origin)
    url.searchParams.set('action', 'random')
    url.searchParams.set('stageId', stageId.toString())
    if (categoryId) url.searchParams.set('categoryId', categoryId.toString())
    url.searchParams.set('count', count.toString())
    const response = await fetch(url.toString())
    if (!response.ok) throw new Error('Failed to fetch random questions')
    const { questions } = await response.json()
    return questions || []
  } catch (error) {
    console.error('Error fetching questions:', error)
    return []
  }
}

// 根据分类随机获取问题
export async function getRandomQuestionsByCategory(categoryId: number, count = 2): Promise<Question[]> {
  try {
    const url = new URL('/api/questions', window.location.origin)
    url.searchParams.set('action', 'randomByCategory')
    url.searchParams.set('categoryId', categoryId.toString())
    url.searchParams.set('count', count.toString())
    const response = await fetch(url.toString())
    if (!response.ok) throw new Error('Failed to fetch questions by category')
    const { questions } = await response.json()
    return questions || []
  } catch (error) {
    console.error('Error fetching questions by category:', error)
    return []
  }
}

// 获取特定阶段的所有问题
export async function getQuestionsByStage(stageId: number): Promise<Question[]> {
  try {
    const url = new URL('/api/questions', window.location.origin)
    url.searchParams.set('action', 'questionsByStage')
    url.searchParams.set('stageId', stageId.toString())
    const response = await fetch(url.toString())
    if (!response.ok) throw new Error('Failed to fetch questions by stage')
    const { questions } = await response.json()
    return questions || []
  } catch (error) {
    console.error('Error fetching questions by stage:', error)
    return []
  }
}

// 根据阶段随机获取一个分类，并按顺序返回该分类下的所有问题
export async function getRandomCategoryQuestionsInOrder(stageId: number): Promise<Question[]> {
  try {
    const url = new URL('/api/questions', window.location.origin);
    url.searchParams.set('action', 'randomCategoryQuestionsInOrder');
    url.searchParams.set('stageId', stageId.toString());
    const response = await fetch(url.toString(), { cache: 'no-store' });
    if (!response.ok) throw new Error('Failed to fetch random category questions');
    const { questions } = await response.json();
    return questions || [];
  } catch (error) {
    console.error('Error fetching questions:', error);
    return [];
  }
}


// 获取特定阶段的题目数量
export async function getQuestionCount(stageId: number, categoryId?: number): Promise<number> {
  try {
    const url = new URL('/api/questions', window.location.origin)
    url.searchParams.set('action', 'count')
    url.searchParams.set('stageId', stageId.toString())
    if (categoryId) url.searchParams.set('categoryId', categoryId.toString())
    const response = await fetch(url.toString())
    if (!response.ok) throw new Error('Failed to fetch question count')
    const { count } = await response.json()
    return count || 0
  } catch (error) {
    console.error('Error fetching question count:', error)
    return 0
  }
}

export async function getQuestionStats(): Promise<{
  totalQuestions: number
  questionsByStage: { stage_id: number; count: number; stage_name: string }[]
}> {
  try {
    const response = await fetch('/api/questions?action=stats')
    if (!response.ok) throw new Error('Failed to fetch question stats')
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching question stats:', error)
    return { totalQuestions: 0, questionsByStage: [] }
  }
}

export async function debugDatabaseConnection(): Promise<void> {
  console.log("=== 数据库连接调试信息 ===")

  try {
    // 检查面试阶段
    const stages = await getInterviewStages()
    console.log("面试阶段:", stages)

    // 检查问题分类
    const categories = await getQuestionCategories()
    console.log("问题分类:", categories)

    // 检查每个阶段的题目数量（使用新的统计函数）
    for (const stage of stages) {
      const count = await getQuestionCount(stage.id)
      console.log(`阶段 ${stage.stage_name} (ID: ${stage.id}) 有 ${count} 道题目`)

      // 获取几道示例题目
      const sampleQuestions = await getRandomQuestions(stage.id, undefined, 3)
      console.log(
        `示例题目:`,
        sampleQuestions.map((q) => q.question_text.substring(0, 30) + "..."),
      )
    }

    // 检查原始数据分布
    const questions = await getQuestionsByStage(stages[0]?.id || 1) // 使用第一个阶段作为示例
    const distribution = questions?.reduce(
      (acc, item) => {
        const key = `stage_${item.stage_id}_cat_${item.category_id}`
        acc[key] = (acc[key] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    console.log("题目分布:", distribution)
  } catch (error) {
    console.error("数据库连接调试失败:", error)
  }
}
