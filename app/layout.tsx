import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from 'sonner'
import './globals.css'
import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/app-shell'

export const metadata: Metadata = {
  title: 'FutureU - AI面试练习平台',
  description: '专业的产品经理面试练习平台，提供AI智能评估和个性化学习建议',
  generator: 'v0.app',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <html lang="zh-CN" className="h-full" suppressHydrationWarning>
      <head />
      <body className={`${GeistSans.className} h-full`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AppShell user={user}>
            {children}
          </AppShell>
          <Toaster richColors position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  )
}
