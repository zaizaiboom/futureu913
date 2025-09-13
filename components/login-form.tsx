"use client"

import { useFormStatus } from "react-dom"
import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import { signIn } from "@/lib/actions"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

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
          登录中...
        </>
      ) : (
        "登录"
      )}
    </Button>
  )
}

export default function LoginForm({ redirectTo, error }: { redirectTo?: string; error?: string }) {
  const router = useRouter()
  const [state, formAction] = useActionState(signIn, null)

  useEffect(() => {
    if (state?.success) {
      router.push(state.redirectTo || '/')
      router.refresh()
    }
    if (state?.error) {
      // You can handle the error display here, e.g., show a toast notification
      console.error("Login failed:", state.error)
    }
  }, [state, router])

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="space-y-2 text-center">
        <h1 className="text-4xl font-semibold tracking-tight">欢迎回来</h1>
        <p className="text-lg text-muted-foreground">登录您的账户</p>
      </div>

      <form action={formAction} className="space-y-6">
        <input type="hidden" name="redirectTo" value={redirectTo} />

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

        {error && <p className="text-sm text-red-500">{error}</p>}

        {state?.error === 'invalid_credentials' && (
          <p className="text-sm text-red-500">邮箱或密码错误，请重试。</p>
        )}
        {state?.error === 'unknown_error' && (
          <p className="text-sm text-red-500">发生未知错误，请稍后重试。</p>
        )}

        <SubmitButton />

        <div className="text-center text-muted-foreground">
          还没有账户？{" "}
          <Link href="/auth/sign-up" className="text-primary hover:underline">
            注册
          </Link>
        </div>
      </form>
    </div>
  )
}
