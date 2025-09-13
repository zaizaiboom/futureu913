// components/sidebar-navigation.tsx
"use client";

import { useInterfaceStore } from "@/lib/store/useInterfaceStore";
import { Home, BarChart, History, Settings, ChevronsLeft, ChevronsRight, LogOut } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";
import UserMenu from "@/components/user-menu";

// 主要导航项
const mainNavItems = [
  { href: "/", icon: Home, label: "主页" },
  { href: "/learning-report", icon: BarChart, label: "学习报告" },
  { href: "/practice-history", icon: History, label: "练习记录" },
];

interface SidebarNavigationProps {
  user?: User | null;
}

export function SidebarNavigation({ user }: SidebarNavigationProps = {}) {
  const { isSidebarCollapsed, toggleSidebar } = useInterfaceStore();
  const [userProfile, setUserProfile] = useState<any>(null);
  const router = useRouter();

  // 监听用户资料变化
  useEffect(() => {
    const getUserProfile = async () => {
      if (user) {
        // 获取用户资料
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
    };

    getUserProfile();
  }, [user]);

  // 监听认证状态变化以更新用户资料
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setUserProfile(null);
        } else if (event === 'SIGNED_IN' && session?.user) {
          // 获取用户资料
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          setUserProfile(profile);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 处理退出登录
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('已成功退出登录');
      router.push('/auth/login');
    } catch (error) {
      console.error('退出登录失败:', error);
      toast.error('退出登录失败');
    }
  };

  // 获取用户显示名称
  const getUserDisplayName = () => {
    if (userProfile?.full_name) return userProfile.full_name;
    if (userProfile?.username) return userProfile.username;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  };

  // 获取用户头像字母
  const getUserInitial = () => {
    const displayName = getUserDisplayName();
    return displayName.charAt(0).toUpperCase();
  };

  return (
    <aside
      className={clsx(
        "hidden md:flex flex-col h-full bg-background border-r transition-all duration-300 ease-in-out",
        isSidebarCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* ===== 顶部: 品牌 Logo ===== */}
      <div className={clsx("flex items-center h-20 px-4", 
        !isSidebarCollapsed ? 'justify-start' : 'justify-center' 
      )}>
        <img src="/logo.png" alt="FutureU Logo" className={clsx("transition-all duration-300", !isSidebarCollapsed ? 'h-10 w-auto' : 'h-9 w-auto')} />
        {!isSidebarCollapsed && <span className="ml-3 text-xl font-bold">FutureU</span>}
      </div>

      {/* ===== 中部: 主要导航 (使用 flex-1 占满剩余空间) ===== */}
      <nav className="flex-1 space-y-1 px-2 py-4">
        {mainNavItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={clsx(
              "flex items-center w-full h-12 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors rounded-lg",
              { "justify-start px-4": !isSidebarCollapsed, "justify-center": isSidebarCollapsed }
            )}
          >
            <item.icon className="h-5 w-5" />
            {!isSidebarCollapsed && <span className="ml-4">{item.label}</span>}
          </Link>
        ))}
      </nav>

      {/* ===== 底部: 用户信息 & 设置 ===== */}
      {user ? (
        <div className="border-t p-2 space-y-1">
          {/* 用户信息区域 */}
          <Link
            href="/settings"
            className={clsx(
              "flex items-center w-full h-14 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors rounded-lg",
              { "p-2": !isSidebarCollapsed, "justify-center": isSidebarCollapsed }
            )}
          >
            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
              {getUserInitial()}
            </div>
            {!isSidebarCollapsed && (
              <div className="ml-3 text-left flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{getUserDisplayName()}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            )}
            {!isSidebarCollapsed && (
              <Settings className="h-4 w-4 text-muted-foreground" />
            )}
          </Link>
          
          {/* 退出登录按钮 */}
          <button
            onClick={handleLogout}
            className={clsx(
              "flex items-center w-full h-12 text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors rounded-lg",
              { "p-2": !isSidebarCollapsed, "justify-center": isSidebarCollapsed }
            )}
          >
            <LogOut className="h-5 w-5" />
            {!isSidebarCollapsed && <span className="ml-3">退出登录</span>}
          </button>
        </div>
      ) : (
        <div className="border-t p-2">
          <Link
            href="/auth/login"
            className={clsx(
              "flex items-center w-full h-12 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors rounded-lg",
              { "p-2": !isSidebarCollapsed, "justify-center": isSidebarCollapsed }
            )}
          >
            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-muted-foreground/20 text-foreground font-bold">
              ?
            </div>
            {!isSidebarCollapsed && (
              <span className="ml-3">登录</span>
            )}
          </Link>
        </div>
      )}

      {/* ===== 最底部: 收缩按钮 ===== */}
      <div className="border-t p-2">
        <button
          onClick={toggleSidebar}
          className="flex items-center justify-center w-full h-10 text-muted-foreground hover:bg-muted rounded-lg"
        >
          {isSidebarCollapsed ? <ChevronsRight /> : <ChevronsLeft />}
        </button>
      </div>
    </aside>
  );
}