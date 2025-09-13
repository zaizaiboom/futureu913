"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Mail, Lock, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react"
import { useState } from "react"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onLogin: (email: string, password: string) => Promise<void>
  onRegister: (email: string, password: string, confirmPassword: string) => Promise<void>
  onForgotPassword: (email: string) => Promise<void>
}

export default function AuthModal({ isOpen, onClose, onLogin, onRegister, onForgotPassword }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register" | "forgot" | "success">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  const resetForm = () => {
    setEmail("")
    setPassword("")
    setConfirmPassword("")
    setError("")
    setSuccessMessage("")
    setIsLoading(false)
  }

  const handleClose = () => {
    resetForm()
    setMode("login")
    onClose()
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError("请填写所有必填字段")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      await onLogin(email, password)
      handleClose()
    } catch (err: any) {
      setError(err.message || "登录失败，请重试")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password || !confirmPassword) {
      setError("请填写所有必填字段")
      return
    }

    if (password !== confirmPassword) {
      setError("两次输入的密码不一致")
      return
    }

    if (password.length < 6) {
      setError("密码长度至少为6位")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      await onRegister(email, password, confirmPassword)
      setSuccessMessage("注册成功！正在为您登录...")
      setMode("success")
      // 延迟关闭模态框，让用户看到成功消息
      setTimeout(() => {
        handleClose()
      }, 2000)
    } catch (err: any) {
      // 提供更友好的错误提示
      let errorMessage = err.message || "注册失败，请重试"
      
      if (errorMessage.includes("Database error saving new user")) {
        errorMessage = "数据库配置问题，请联系管理员或稍后重试"
      } else if (errorMessage.includes("already exists") || errorMessage.includes("duplicate")) {
        errorMessage = "该邮箱已被注册，请使用其他邮箱或尝试登录"
      } else if (errorMessage.includes("invalid email")) {
        errorMessage = "邮箱格式不正确，请检查后重试"
      } else if (errorMessage.includes("weak password")) {
        errorMessage = "密码强度不够，请使用至少6位包含字母和数字的密码"
      } else if (errorMessage.includes("Supabase未配置")) {
        errorMessage = "系统配置问题，请联系管理员"
      }
      
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      setError("请输入邮箱地址")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      await onForgotPassword(email)
      setSuccessMessage("重置密码邮件已发送，请查收邮箱")
      setMode("success")
    } catch (err: any) {
      setError(err.message || "发送失败，请重试")
    } finally {
      setIsLoading(false)
    }
  }

  const renderContent = () => {
    switch (mode) {
      case "login":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">欢迎回来</h2>
              <p className="text-gray-600 mt-2">登录您的FutureU账户</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">邮箱地址</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="请输入邮箱地址"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">密码</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="请输入密码"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "登录中..." : "登录"}
              </Button>
            </form>

            <div className="text-center space-y-2">
              <a
                href="/auth/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                忘记密码？
              </a>
              <div className="text-sm text-gray-600">
                还没有账户？{" "}
                <button
                  type="button"
                  onClick={() => setMode("register")}
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  立即注册
                </button>
              </div>
            </div>
          </div>
        )

      case "register":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">创建账户</h2>
              <p className="text-gray-600 mt-2">加入FutureU，开启AI PM学习之旅</p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="register-email">邮箱地址</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="请输入邮箱地址"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-password">密码</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="请输入密码（至少6位）"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">确认密码</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="请再次输入密码"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "注册中..." : "创建账户"}
              </Button>
            </form>

            <div className="text-center">
              <div className="text-sm text-gray-600">
                已有账户？{" "}
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  立即登录
                </button>
              </div>
            </div>
          </div>
        )

      case "forgot":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">重置密码</h2>
              <p className="text-gray-600 mt-2">输入您的邮箱地址，我们将发送重置链接</p>
            </div>

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forgot-email">邮箱地址</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="请输入邮箱地址"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "发送中..." : "发送重置邮件"}
              </Button>
            </form>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setMode("login")}
                className="text-sm text-blue-600 hover:text-blue-800 underline flex items-center justify-center"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                返回登录
              </button>
            </div>
          </div>
        )

      case "success":
        return (
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">操作成功</h2>
              <p className="text-gray-600 mt-2">{successMessage}</p>
            </div>
            <Button onClick={() => setMode("login")} className="w-full">
              返回登录
            </Button>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogTitle className="sr-only">
          {mode === "login" ? "登录" : mode === "register" ? "注册" : mode === "forgot" ? "忘记密码" : "操作成功"}
        </DialogTitle>
        <div className="p-6">{renderContent()}</div>
      </DialogContent>
    </Dialog>
  )
}
