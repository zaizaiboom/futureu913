import { createClient } from '@/lib/supabase/server'
import LoginForm from '@/components/login-form'
import { redirect } from 'next/navigation'

export const dynamic = "force-dynamic"

interface LoginPageProps {
  searchParams: Promise<{
    redirectTo?: string
    error?: string
  }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { redirectTo, error } = await searchParams
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    redirect(redirectTo || '/')
  }
  
  let errorMessage = ''
  if (error === 'invalid_credentials') {
    errorMessage = '邮箱或密码错误，请重试。'
  } else if (error === 'email_not_confirmed') {
    errorMessage = '请先验证您的邮箱地址。'
  } else if (error) {
    errorMessage = '登录失败，请重试。'
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            登录到您的账户
          </h2>
        </div>
        <LoginForm redirectTo={redirectTo} error={errorMessage} />
      </div>
    </div>
  )
}
