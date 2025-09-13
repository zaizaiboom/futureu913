import { createClient } from '@/lib/supabase/server'
import { User } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'

export interface AuthResult {
  user: User
  error: null
}

export interface AuthError {
  user: null
  error: string
}

export type AuthResponse = AuthResult | AuthError

/**
 * 获取当前认证用户，如果未认证则重定向到登录页
 * @param redirectTo - 登录后重定向的路径
 * @returns 认证的用户对象
 */
export async function requireAuth(redirectTo?: string): Promise<User> {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('认证错误:', error.message)
      const redirectPath = redirectTo ? `/auth/login?redirectTo=${encodeURIComponent(redirectTo)}` : '/auth/login'
      redirect(redirectPath)
    }
    
    if (!user) {
      console.log('用户未登录')
      const redirectPath = redirectTo ? `/auth/login?redirectTo=${encodeURIComponent(redirectTo)}` : '/auth/login'
      redirect(redirectPath)
    }
    
    return user
  } catch (error) {
    console.error('获取用户信息时发生错误:', error)
    const redirectPath = redirectTo ? `/auth/login?redirectTo=${encodeURIComponent(redirectTo)}` : '/auth/login'
    redirect(redirectPath)
  }
}

/**
 * 获取当前认证用户，不进行重定向
 * @returns 认证结果或错误信息
 */
export async function getAuthUser(): Promise<AuthResponse> {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      return {
        user: null,
        error: `认证错误: ${error.message}`
      }
    }
    
    if (!user) {
      return {
        user: null,
        error: '用户未登录'
      }
    }
    
    return {
      user,
      error: null
    }
  } catch (error) {
    return {
      user: null,
      error: `获取用户信息时发生错误: ${error instanceof Error ? error.message : '未知错误'}`
    }
  }
}

/**
 * 刷新用户会话
 * @returns 刷新结果
 */
export async function refreshSession(): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.refreshSession()
    
    if (error) {
      return {
        success: false,
        error: `会话刷新失败: ${error.message}`
      }
    }
    
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: `会话刷新时发生错误: ${error instanceof Error ? error.message : '未知错误'}`
    }
  }
}

/**
 * 安全登出
 * @returns 登出结果
 */
export async function signOut(): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      return {
        success: false,
        error: `登出失败: ${error.message}`
      }
    }
    
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: `登出时发生错误: ${error instanceof Error ? error.message : '未知错误'}`
    }
  }
}

/**
 * 检查用户是否已认证（不抛出错误）
 * @returns 是否已认证
 */
export async function isAuthenticated(): Promise<boolean> {
  const result = await getAuthUser()
  return result.user !== null
}

/**
 * 获取用户会话信息
 * @returns 会话信息
 */
export async function getSession() {
  try {
    const supabase = await createClient()
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('获取会话失败:', error.message)
      return null
    }
    
    return session
  } catch (error) {
    console.error('获取会话时发生错误:', error)
    return null
  }
}