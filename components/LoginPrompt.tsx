import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useRouter } from 'next/navigation';

function LoginPrompt() {
  const router = useRouter();

  const handleLogin = () => {
    window.location.assign('/auth/login?redirectTo=/');
  };

  return (
    <Card className="max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle>解锁完整体验</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4">您已完成练习！登录后，您可以：</p>
        <ul className="list-disc pl-5 mb-4">
          <li>永久保存您的练习记录</li>
          <li>查看详细的学习报告和分析</li>
          <li>跟踪您的进步并获得个性化建议</li>
        </ul>
        <p className="mb-4">注册只需几秒钟，开始您的个性化学习之旅！</p>
        <Button onClick={handleLogin} className="w-full">立即登录/注册</Button>
      </CardContent>
    </Card>
  );
}

export default LoginPrompt;