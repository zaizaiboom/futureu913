import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function middleware(request: NextRequest) {
  if (request.nextUrl.searchParams.has('_rsc')) {
    return NextResponse.next();
  }
  // 1. response 对象只在这里创建一次
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    'https://jxsewcsxhiycofydtxhi.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4c2V3Y3N4aGl5Y29meWR0eGhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzOTQ2NDcsImV4cCI6MjA2OTk3MDY0N30.yZmvdpVY3HkcHo0AANySLpUgyNsl0M6PUnEYnprJrcs',
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        // 2. set 方法只修改 request 和 response，不再重新创建 response
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response.cookies.set({ name, value, ...options })
        },
        // 3. remove 方法也只修改 request 和 response
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  let user = null;
try {
  const { data: { user: fetchedUser } } = await supabase.auth.getUser();
  user = fetchedUser;
} catch (error) {
  console.error('Error fetching user:', error);
  // Optionally, clear invalid session
  await supabase.auth.signOut();
}

  // --- 你的路由保护逻辑保持不变 ---
  const protectedRoutes = ['/settings', '/learning-report', '/practice-history', '/interview-practice']
  const { pathname } = request.nextUrl

  if (!user && protectedRoutes.some(route => pathname.startsWith(route))) {
    const redirectUrl = new URL('/auth/login', request.url)
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  if (user && pathname === '/auth/login') {
    const redirectTo = request.nextUrl.searchParams.get('redirectTo')
    // 避免重定向循环，如果 redirectTo 是受保护的路由，直接跳转到首页
    if (redirectTo && protectedRoutes.some(route => redirectTo.startsWith(route))) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return NextResponse.redirect(new URL(redirectTo || '/', request.url))
  }
  // --- 路由保护逻辑结束 ---

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/.*).*)',
  ],
}