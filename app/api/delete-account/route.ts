import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => cookieStore.set({ name, value, ...options }))
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          }
        }
      }
    )
    
    // 获取当前用户
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      console.error('Supabase auth error:', authError);
    }
    if (!user) {
      console.error('No user found from Supabase.');
    }
    
    if (authError || !user) {
      return NextResponse.json(
        { error: '用户未认证', details: authError ? authError.message : 'No user object' },
        { status: 401 }
      )
    }

    const userId = user.id

    // 开始事务删除用户相关数据
    // 1. 删除练习会话记录
    const { error: practiceError } = await supabase
      .from('practice_sessions')
      .delete()
      .eq('user_id', userId)

    if (practiceError) {
      console.error('删除练习记录失败:', practiceError)
      return NextResponse.json(
        { error: '删除练习记录失败' },
        { status: 500 }
      )
    }

    // 2. 删除用户偏好设置
    const { error: preferencesError } = await supabase
      .from('user_preferences')
      .delete()
      .eq('user_id', userId)

    if (preferencesError) {
      console.error('删除用户偏好失败:', preferencesError)
      // 这个不是致命错误，继续执行
    }

    // 3. 删除用户档案
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (profileError) {
      console.error('删除用户档案失败:', profileError)
      // 这个不是致命错误，继续执行
    }

    // 4. 最后删除用户认证记录
    // 创建管理员客户端用于删除用户
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(
      userId
    )

    if (deleteUserError) {
      console.error('删除用户认证失败:', deleteUserError)
      return NextResponse.json(
        { error: '删除用户认证失败' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: '账户已成功删除' },
      { status: 200 }
    )

  } catch (error) {
    console.error('删除账户时发生错误:', error)
    return NextResponse.json(
      { error: '删除账户失败' },
      { status: 500 }
    )
  }
}