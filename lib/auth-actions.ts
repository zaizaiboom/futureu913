"use server"

import { createClient } from "@/lib/supabase/server"

export async function signIn(email: string, password: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error("Login error details:", error)
    if (error.message.includes("Invalid login credentials")) {
      throw new Error("邮箱或密码错误，请检查后重试")
    } else if (error.message.includes("Email not confirmed")) {
      throw new Error("请先验证您的邮箱地址")
    } else if (error.message.includes("Too many requests")) {
      throw new Error("登录尝试过于频繁，请稍后再试")
    }
    throw new Error(error.message)
  }

  return data
}

export async function signUp(email: string, password: string) {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo:
          process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
          `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`,
        data: {
          email_confirm: false, // 禁用邮箱确认以简化流程
        },
      },
    })

    if (error) {
      console.error("Registration error details:", error)
      if (error.message.includes("duplicate key") || error.message.includes("already exists")) {
        throw new Error("该邮箱已被注册，请使用其他邮箱或尝试登录")
      }
      if (error.message.includes("invalid email")) {
        throw new Error("邮箱格式不正确，请检查后重试")
      }
      if (error.message.includes("weak password")) {
        throw new Error("密码强度不够，请使用至少6位包含字母和数字的密码")
      }
      throw new Error(`注册失败: ${error.message}`)
    }

    // 如果注册成功但用户还未激活，尝试手动创建profile记录
    if (data.user && data.user.id) {
      try {
        // 使用服务端权限来创建profile记录
        const { error: profileError } = await supabase.from("profiles").upsert(
          {
            id: data.user.id,
            email: email,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "id",
          },
        )

        if (profileError) {
          console.warn("Profile creation warning:", profileError.message)
          // 不因为profile创建失败而终止注册流程
        }
      } catch (profileErr) {
        console.warn("Profile creation error:", profileErr)
        // 继续注册流程，profile可以后续创建
      }
    }

    // 如果注册成功但需要邮箱确认，尝试自动登录
    if (data.user && !data.session) {
      try {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        })

        if (signInError) {
          console.warn("Auto sign-in after registration failed:", signInError.message)
        }
      } catch (signInErr) {
        console.warn("Auto sign-in error:", signInErr)
      }
    }

    return data
  } catch (error: any) {
    console.error("注册错误:", error)
    throw new Error(error.message || "注册过程中发生错误，请稍后重试")
  }
}

export async function signOut() {
  const supabase = await createClient()

  const { error } = await supabase.auth.signOut()

  if (error) {
    throw new Error(error.message)
  }
}

export async function resetPassword(email: string) {
  const supabase = await createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo:
      process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
      `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/reset-password`,
  })

  if (error) {
    throw new Error(error.message)
  }
}
