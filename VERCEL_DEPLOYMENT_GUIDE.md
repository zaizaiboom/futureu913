# Vercel 部署指南

本指南将帮助您将 FutureU 项目成功部署到 Vercel 平台。

## 1. 部署前准备

### 1.1 环境变量配置清单

在部署前，请确保您已准备好以下环境变量：

| 环境变量名 | 说明 | 必需性 |
|-----------|------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL | 必需 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名密钥 | 必需 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 服务角色密钥 | 必需 |
| `SILICONFLOW_API_KEY` | SiliconFlow AI 服务密钥 | 必需 |
| `DEEPSEEK_API_KEY` | DeepSeek AI 服务密钥 | 可选 |
| `SITE_URL` | 网站 URL | 推荐 |

### 1.2 Supabase 设置

1. **创建 Supabase 项目**
   - 访问 [Supabase Dashboard](https://supabase.com/dashboard)
   - 创建新项目或使用现有项目
   - 记录项目 URL 和 API 密钥

2. **配置数据库**
   - 确保数据库表结构已正确创建
   - 检查 RLS (Row Level Security) 策略
   - 验证用户认证设置

3. **获取密钥**
   - 在项目设置 > API 中找到：
     - Project URL
     - anon/public key
     - service_role key

### 1.3 GitHub 仓库准备

1. **推送代码到 GitHub**
   ```bash
   git add .
   git commit -m "准备 Vercel 部署"
   git push origin main
   ```

2. **确保文件完整**
   - `package.json` - 包含所有依赖
   - `next.config.mjs` - Next.js 配置
   - `vercel.json` - Vercel 部署配置
   - `.vercelignore` - 忽略文件配置

## 2. Vercel 部署步骤

### 2.1 连接 GitHub 仓库

1. **登录 Vercel**
   - 访问 [Vercel Dashboard](https://vercel.com/dashboard)
   - 使用 GitHub 账号登录

2. **导入项目**
   - 点击 "New Project"
   - 选择您的 GitHub 仓库
   - 点击 "Import"

### 2.2 配置项目设置

1. **框架预设**
   - Framework Preset: `Next.js`
   - Root Directory: `./` (默认)

2. **构建设置**
   - Build Command: `pnpm run build`
   - Output Directory: `.next` (默认)
   - Install Command: `pnpm install`

### 2.3 配置环境变量

在 Vercel 项目设置中添加以下环境变量：

1. **进入环境变量设置**
   - 项目 Dashboard > Settings > Environment Variables

2. **添加变量**
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   SILICONFLOW_API_KEY=your_siliconflow_api_key
   DEEPSEEK_API_KEY=your_deepseek_api_key
   SITE_URL=https://your-project.vercel.app
   ```

3. **环境设置**
   - 为 Production、Preview、Development 环境分别配置
   - 确保敏感信息只在必要环境中配置

### 2.4 部署

1. **首次部署**
   - 配置完成后点击 "Deploy"
   - 等待构建完成（通常 2-5 分钟）

2. **查看部署状态**
   - 在 Deployments 页面查看构建日志
   - 确认部署成功

## 3. 环境变量详细说明

### 3.1 Supabase 相关

- **NEXT_PUBLIC_SUPABASE_URL**
  - 格式: `https://your-project.supabase.co`
  - 用途: 客户端连接 Supabase
  - 安全性: 公开（前缀 NEXT_PUBLIC_）

- **NEXT_PUBLIC_SUPABASE_ANON_KEY**
  - 格式: `eyJ...` (JWT 格式)
  - 用途: 客户端匿名访问
  - 安全性: 公开，但有 RLS 保护

- **SUPABASE_SERVICE_ROLE_KEY**
  - 格式: `eyJ...` (JWT 格式)
  - 用途: 服务端操作，绕过 RLS
  - 安全性: 私密，仅服务端使用

### 3.2 AI 服务相关

- **SILICONFLOW_API_KEY**
  - 格式: `sk-...`
  - 用途: SiliconFlow AI 服务认证
  - 安全性: 私密

- **DEEPSEEK_API_KEY**
  - 格式: `sk-...`
  - 用途: DeepSeek AI 服务认证
  - 安全性: 私密

### 3.3 站点配置

- **SITE_URL**
  - 格式: `https://your-domain.com`
  - 用途: 回调 URL、邮件链接等
  - 建议: 使用自定义域名或 Vercel 域名

## 4. 常见问题和解决方案

### 4.1 构建失败

**问题**: `pnpm install` 失败
```
ERR_PNPM_OUTDATED_LOCKFILE
```

**解决方案**:
1. 本地运行 `pnpm install` 更新 lockfile
2. 提交并推送更新的 `pnpm-lock.yaml`
3. 重新部署

**问题**: TypeScript 编译错误

**解决方案**:
1. 检查 `tsconfig.json` 配置
2. 确保所有类型定义正确
3. 本地运行 `pnpm run build` 验证

### 4.2 环境变量配置错误

**问题**: Supabase 连接失败

**解决方案**:
1. 验证 URL 和密钥格式
2. 检查 Supabase 项目状态
3. 确认环境变量名称正确

**问题**: AI 服务调用失败

**解决方案**:
1. 验证 API 密钥有效性
2. 检查服务配额和限制
3. 查看 API 调用日志

### 4.3 数据库连接问题

**问题**: RLS 策略阻止访问

**解决方案**:
1. 检查 RLS 策略配置
2. 确认用户认证状态
3. 验证权限设置

**问题**: 数据库查询超时

**解决方案**:
1. 优化查询语句
2. 添加适当索引
3. 检查网络连接

### 4.4 部署配置问题

**问题**: 静态文件 404

**解决方案**:
1. 检查 `next.config.mjs` 配置
2. 验证 `public` 目录结构
3. 确认构建输出正确

**问题**: API 路由不工作

**解决方案**:
1. 检查 `vercel.json` 重写规则
2. 验证 API 路由文件位置
3. 确认函数配置正确

## 5. 部署后验证

### 5.1 功能测试清单

- [ ] **页面加载**
  - [ ] 首页正常显示
  - [ ] 学习报告页面可访问
  - [ ] 路由跳转正常

- [ ] **用户认证**
  - [ ] 登录功能正常
  - [ ] 注册功能正常
  - [ ] 登出功能正常

- [ ] **数据操作**
  - [ ] 数据读取正常
  - [ ] 数据写入正常
  - [ ] 权限控制有效

- [ ] **AI 功能**
  - [ ] AI 分析正常
  - [ ] 报告生成正常
  - [ ] 响应时间合理

### 5.2 性能检查

1. **页面性能**
   - 使用 Lighthouse 检查性能分数
   - 确保 Core Web Vitals 达标
   - 检查资源加载时间

2. **API 性能**
   - 监控 API 响应时间
   - 检查数据库查询性能
   - 验证缓存策略

3. **监控设置**
   - 配置 Vercel Analytics
   - 设置错误监控
   - 启用性能监控

### 5.3 安全检查

- [ ] **环境变量安全**
  - [ ] 敏感信息未暴露
  - [ ] 密钥权限最小化
  - [ ] 定期轮换密钥

- [ ] **数据安全**
  - [ ] RLS 策略有效
  - [ ] 用户数据隔离
  - [ ] 输入验证完整

## 6. 维护和更新

### 6.1 自动部署

- 推送到 `main` 分支自动触发部署
- 使用 Preview 部署测试功能
- 配置部署通知

### 6.2 监控和日志

- 定期检查 Vercel 函数日志
- 监控错误率和性能指标
- 设置告警通知

### 6.3 备份和恢复

- 定期备份 Supabase 数据
- 保存环境变量配置
- 维护部署配置文档

---

## 联系支持

如果遇到问题，可以：
1. 查看 [Vercel 文档](https://vercel.com/docs)
2. 查看 [Supabase 文档](https://supabase.com/docs)
3. 检查项目 GitHub Issues
4. 联系开发团队

**祝您部署顺利！** 🚀