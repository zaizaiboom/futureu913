import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { SettingsClient } from './client'
import { User } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

interface UserPreferences {
  notifications: boolean
  theme: 'light' | 'dark' | 'system'
  language: string
  practiceReminders: boolean
  emailUpdates: boolean
}

interface SettingsData {
  user: User
  preferences: UserPreferences
}

async function getSettingsData(): Promise<SettingsData | null> {
  try {
    const supabase = await createSupabaseServerClient()
    
    // 获取用户信息
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('用户认证失败:', userError)
      return null
    }

    // 获取用户偏好设置（如果存在的话）
    const { data: preferencesData, error: preferencesError } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // 默认偏好设置
    const defaultPreferences: UserPreferences = {
      notifications: true,
      theme: 'system',
      language: 'zh-CN',
      practiceReminders: true,
      emailUpdates: false
    }

    let preferences = defaultPreferences
    
    if (!preferencesError && preferencesData) {
      preferences = {
        notifications: preferencesData.notifications ?? defaultPreferences.notifications,
        theme: preferencesData.theme ?? defaultPreferences.theme,
        language: preferencesData.language ?? defaultPreferences.language,
        practiceReminders: preferencesData.practice_reminders ?? defaultPreferences.practiceReminders,
        emailUpdates: preferencesData.email_updates ?? defaultPreferences.emailUpdates
      }
    } else if (preferencesError) {
      console.log('用户偏好设置不存在，使用默认设置:', preferencesError.message)
    }

    return {
      user,
      preferences
    }
  } catch (error) {
    console.error('获取设置数据时发生错误:', error)
    return null
  }
}

export default async function SettingsPage() {
  const data = await getSettingsData()
  
  if (!data) {
    redirect('/auth/login?redirectTo=/settings')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">设置</h1>
        <p className="text-gray-600">管理您的账户设置和偏好</p>
      </div>

      <Suspense fallback={
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">加载中...</span>
        </div>
      }>
        <SettingsClient 
          user={data.user}
          preferences={data.preferences}
        />
      </Suspense>
    </div>
  )
}