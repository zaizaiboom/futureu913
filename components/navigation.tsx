'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Home, User as UserIcon, History, BarChart3, Settings, LogOut } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface NavigationProps {
  currentPage?: string
}

interface Profile {
  id: string
  full_name?: string
  avatar_url?: string
  username?: string
}

export default function Navigation({ currentPage }: NavigationProps) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const router = useRouter()
  
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, username')
        .eq('id', userId)
        .single()
      
      if (error) {
        console.error('Error fetching profile:', error)
        return
      }
      
      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  useEffect(() => {
    // 初始获取session
    const initSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      }
    };
    initSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`Navigation: auth state change detected. Event: ${event}`, session?.user?.email);
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id);
        const pendingSession = localStorage.getItem('pendingPracticeSession');
        if (pendingSession) {
          try {
            const sessionData = JSON.parse(pendingSession);
            sessionData.user_id = session.user.id;
            const response = await fetch('/api/practice-sessions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(sessionData),
            });
            if (response.ok) {
              localStorage.removeItem('pendingPracticeSession');
              console.log('Pending practice session saved successfully');
            }
          } catch (error) {
            console.error('Error saving pending session:', error);
          }
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // 单独的useEffect来处理profiles表的监听
  useEffect(() => {
    let profileSubscription: any = null
    if (user) {
      profileSubscription = supabase
        .channel(`profile-changes-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${user.id}`
          },
          (payload) => {
            console.log('Profile updated:', payload.new)
            setProfile(payload.new as Profile)
          }
        )
        .subscribe()
    }

    return () => {
      if (profileSubscription) {
        profileSubscription.unsubscribe()
      }
    }
  }, [user?.id])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      toast.success('已退出登录')
      router.push('/auth/login')
    } catch (error) {
      toast.error('退出登录失败')
    }
  }

  const navigationItems = [
    { href: '/practice-history', label: '练习记录', icon: History, key: 'practice-history' },
    { href: '/learning-report', label: '学习报告', icon: BarChart3, key: 'learning-report' },
    { href: '/settings', label: '设置', icon: Settings, key: 'settings' },
  ]

  return (
    <div className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* 左侧：返回首页 + 当前页面标题 */}
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button
                variant="ghost"
                className="text-gray-600 hover:text-gray-900 flex items-center space-x-2"
              >
                <Home className="w-4 h-4" />
                <span>返回首页</span>
              </Button>
            </Link>
            {currentPage && (
              <>
                <div className="h-6 w-px bg-gray-300" />
                <h1 className="text-xl font-semibold text-gray-900">
                  {navigationItems.find(item => item.key === currentPage)?.label || 'FutureU'}
                </h1>
              </>
            )}
          </div>

          {/* 右侧：空白区域，用户菜单已移至侧边栏 */}
          <div className="flex items-center space-x-4">
            {/* 预留空间用于未来功能 */}
          </div>
        </div>
      </div>
    </div>
  )
}