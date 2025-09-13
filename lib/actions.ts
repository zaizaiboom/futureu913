'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function signUp(prevState: any, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    console.error('SignUp error:', error)
    if (error.message.includes('User already registered')) {
      return { error: '该邮箱已被注册，请直接登录。' }
    }
    if (error.message.includes('Password should be at least 6 characters')) {
      return { error: '密码必须至少包含6个字符。' }
    }
    return { error: '创建账户失败，请稍后重试。' }
  }

  if (data.user && !data.user.email_confirmed_at) {
    return { success: '注册成功！请检查您的邮箱以完成验证。' }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signIn(prevState: any, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const redirectTo = formData.get('redirectTo') as string

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('Login error:', error)
    const errorParam = error.message.includes('Invalid login credentials')
      ? 'invalid_credentials'
      : 'unknown_error'
    return { error: errorParam, redirectTo: redirectTo || null }
  }

  revalidatePath('/', 'layout')
  return { success: true, redirectTo: redirectTo || '/' }
}
