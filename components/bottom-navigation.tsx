"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, BarChart3, BookOpen, User as UserIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import type { User } from "@supabase/supabase-js"

interface NavigationItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const navigationItems: NavigationItem[] = [
  {
    href: "/",
    label: "主页",
    icon: Home,
  },
  {
    href: "/learning-report",
    label: "学习报告",
    icon: BarChart3,
  },
  {
    href: "/practice-history",
    label: "练习记录",
    icon: BookOpen,
  },
  {
    href: "/settings",
    label: "我",
    icon: UserIcon,
  },
]

interface BottomNavigationProps {
  user: User | null
}

export default function BottomNavigation({ user }: BottomNavigationProps) {
  const pathname = usePathname()

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 z-40 md:hidden">
      <nav className="flex justify-around items-center h-16">
        {navigationItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <Link key={item.href} href={item.href} className="flex-1">
              <div className={cn(
                "flex flex-col items-center justify-center h-full transition-colors duration-200",
                isActive ? "text-blue-600" : "text-gray-500 hover:text-blue-600"
              )}>
                <Icon className="w-6 h-6 mb-1" />
                <span className="text-xs font-medium">{item.label}</span>
              </div>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}