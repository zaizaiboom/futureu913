"use client"

import { useActionState, useEffect } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signUp } from "@/lib/actions"

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg font-medium rounded-lg h-[60px]"
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          注册中...
        </>
      ) : (
        "注册"
      )}
    </Button>
  )
}

export default function SignUpForm() {
  const [state, formAction] = useActionState(signUp, null)
  const router = useRouter()

  // 注册成功后自动跳转到首页
  useEffect(() => {
    if (state?.success) {
      setTimeout(() => {
        router.push('/')
      }, 1500) // 1.5秒后跳转，让用户看到成功消息
    }
  }, [state?.success, router])

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="space-y-2 text-center">
        <h1 className="text-4xl font-semibold tracking-tight">创建账户</h1>
        <p className="text-lg text-muted-foreground">注册开始使用</p>
      </div>

      <form action={formAction} className="space-y-6">
        {state?.error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-700 px-4 py-3 rounded">{state.error}</div>
        )}

        {state?.success && (
          <div className="bg-green-500/10 border border-green-500/50 text-green-700 px-4 py-3 rounded">
            {state.success}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium">
              邮箱
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="your@example.com"
              required
              className="bg-background border-input"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium">
              密码
            </label>
            <Input id="password" name="password" type="password" required className="bg-background border-input" />
          </div>
        </div>

        <SubmitButton />

        <div className="text-center text-muted-foreground">
          已有账户？{" "}
          <Link href="/auth/login" className="text-primary hover:underline">
            登录
          </Link>
        </div>
      </form>
    </div>
  )
}
