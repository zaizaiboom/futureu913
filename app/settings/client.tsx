'use client'

import { User } from '@supabase/supabase-js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { LogOut, Settings, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase/client'

interface UserPreferences {
  notifications: boolean
  theme: 'light' | 'dark' | 'system'
  language: string
  practiceReminders: boolean
  emailUpdates: boolean
}

interface SettingsClientProps {
  user: User
  preferences: UserPreferences
}

export function SettingsClient({ user, preferences }: SettingsClientProps) {
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
    toast.success('已成功退出登录')
  }

  const deleteAccount = async () => {
    try {
      // 调用删除账户API
      const response = await fetch('/api/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '删除账户失败')
      }

      // 删除成功后登出并跳转
      await supabase.auth.signOut()
      router.push('/auth/login')
      toast.success('账户已成功删除')
    } catch (error) {
      console.error('Error deleting account:', error)
      toast.error(error instanceof Error ? error.message : '删除账户失败')
    }
  }

  return (
    <div className="p-6">
        <div className="max-w-4xl mx-auto">
          {/* 页面标题 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
              <Settings className="mr-2 h-8 w-8" />
              设置
            </h1>
            <p className="text-gray-600">管理你的账户设置和操作</p>
          </div>

          <div className="space-y-6">
            {/* 常规操作 */}
            <Card>
              <CardHeader>
                <CardTitle>常规操作</CardTitle>
              </CardHeader>
              <CardContent>
                <Button onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" /> 退出登录
                </Button>
              </CardContent>
            </Card>
            {/* 危险操作 */}
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <Trash2 className="h-5 w-5" />
                  危险操作
                </CardTitle>
                <CardDescription>
                  这些操作不可逆转，请谨慎操作
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      注销账户
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>确认注销账户</AlertDialogTitle>
                      <AlertDialogDescription>
                        此操作将永久删除你的账户和所有相关数据，包括练习记录、学习报告等。此操作不可撤销。
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>取消</AlertDialogCancel>
                      <AlertDialogAction onClick={deleteAccount} className="bg-red-600 hover:bg-red-700">
                        确认删除
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
  )
}