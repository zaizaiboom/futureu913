import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import SignUpForm from "@/components/sign-up-form"

export const dynamic = "force-dynamic"

export default async function SignUpPage() {
  // 如果Supabase未配置，显示设置消息
  if (!isSupabaseConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">请连接Supabase以开始使用</h1>
      </div>
    )
  }

  // 检查用户是否已登录
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // 如果用户已登录，重定向到首页
  if (session) {
    redirect("/")
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <SignUpForm />
    </div>
  )
}
