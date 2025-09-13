"use client";

import { SidebarNavigation } from '@/components/sidebar-navigation';
import BottomNavigation from '@/components/bottom-navigation';
import { cn } from '@/lib/utils';
import type { User } from "@supabase/supabase-js";
import { useMediaQuery } from '@/hooks/use-media-query';
import { useInterfaceStore } from '@/lib/store/useInterfaceStore';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

interface AppShellProps {
  user: User | null;
  children: React.ReactNode;
}

export default function AppShell({ user: initialUser, children }: AppShellProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const { isSidebarCollapsed } = useInterfaceStore();
  const [currentUser, setCurrentUser] = useState<User | null>(initialUser);

  // 监听用户状态变化
  useEffect(() => {
    // 设置初始用户状态
    setCurrentUser(initialUser);

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
        } else if (event === 'SIGNED_IN' && session?.user) {
          setCurrentUser(session.user);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [initialUser]);

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {isDesktop && (
        <SidebarNavigation user={currentUser} />
      )}
      <main className={cn(
        "flex-1 transition-all duration-300 ease-in-out overflow-auto",
        isDesktop ? "ml-20" : "pb-16"
      )}>
        <div className={cn(
          "w-full h-full transition-all duration-300 ease-in-out",
          isDesktop && !isSidebarCollapsed ? "ml-11" : ""
        )}>
          {children}
        </div>
      </main>
      {!isDesktop && <BottomNavigation user={currentUser} />}
    </div>
  );
}