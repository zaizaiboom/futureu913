# FutureU 数据流说明文档

## 项目概述
FutureU 是一个基于 Next.js + Supabase 的 AI 面试练习平台，提供 HR 面试、专业面试和终面三个模块的练习功能。

## 数据架构概览

### 1. 数据库表结构（Supabase）

#### 核心表
- **profiles**: 用户档案表
- **interview_stages**: 面试阶段表（HR面、专业面、终面）
- **question_categories**: 问题分类表
- **interview_questions**: 面试问题表
- **practice_sessions**: 练习会话表
- **competency_assessments**: 能力评估表
- **ai_insights**: AI 洞察表
- **user_skills**: 用户技能表
- **user_preferences**: 用户偏好表
- **evaluation_tasks**: 评估任务表

#### 数据关系
```
profiles (用户) 
├── practice_sessions (练习记录)
├── competency_assessments (能力评估)
├── ai_insights (AI洞察)
├── user_skills (技能)
└── user_preferences (偏好)

interview_stages (面试阶段)
├── interview_questions (问题)
└── practice_sessions (练习记录)

question_categories (问题分类)
└── interview_questions (问题)
```

### 2. 模拟数据位置

#### 数据库脚本文件（scripts/ 目录）
- **complete-database-setup.sql**: 完整数据库设置脚本
  - 包含表结构创建
  - 基础数据插入（面试阶段、问题分类）
  - 示例面试问题（HR面、专业面、终面）
  - RLS 策略设置

- **02-seed-data.sql**: 基础种子数据
  - 面试阶段数据
  - 问题分类数据
  - 示例面试问题

- **01-insert-interview-questions.sql**: 面试问题数据
  - HR 面试问题
  - 专业面试问题
  - 终面问题

- **06-import-new-questions.sql**: 新增问题数据
  - 更多面试场景问题
  - 包含标准答案和建议

#### 前端模拟数据
- **app/learning-report/page.tsx**: 学习报告模拟数据
  ```typescript
  const actionHandbook = {
    improvementArea: 'AI问题建模',
    recommendedArticle: 'AI建模基础',
    practiceQuestion: '描述一个AI问题的建模过程',
    thinkingTool: 'SWOT分析'
  }
  
  const abilities = ['产品洞察', 'AI方案构建', '逻辑沟通', '落地迭代']
  const growthData = [
    { date: '2023-01', '产品洞察': 60, 'AI方案构建': 50, '逻辑沟通': 70, '落地迭代': 55 },
    { date: '2023-02', '产品洞察': 65, 'AI方案构建': 55, '逻辑沟通': 75, '落地迭代': 60 }
  ]
  ```

- **lib/qualitative-analytics.ts**: 定性分析模拟数据
  - 能力分析数据生成
  - 建议频率统计
  - 累计亮点计算

### 3. 数据流向

#### 3.1 用户认证流程
```
用户登录 → Supabase Auth → profiles 表 → 用户状态更新
```

#### 3.2 面试练习流程
```
选择面试模块 → lib/questions-service.ts → Supabase 查询 → 
interview_questions 表 → 返回问题列表 → 用户答题 → 
AI 评估 → practice_sessions 表存储
```

#### 3.3 学习报告生成流程
```
用户访问学习报告 → app/learning-report/page.tsx → 
Supabase 查询 practice_sessions → 数据聚合分析 → 
lib/qualitative-analytics.ts 处理 → 生成报告
```

### 4. 关键数据服务文件

#### 4.1 lib/questions-service.ts
- **功能**: 问题数据获取和管理
- **主要方法**:
  - `getRandomQuestions()`: 获取随机问题
  - `getQuestionCount()`: 获取问题数量
  - `getQuestionStats()`: 获取问题统计
  - `getRandomCategoryQuestionsInOrder()`: 按分类获取问题

#### 4.2 lib/actions.ts
- **功能**: 服务端操作
- **主要方法**:
  - 用户注册和登录
  - 数据库操作封装

#### 4.3 lib/ai-service.ts
- **功能**: AI 评估服务
- **主要方法**:
  - AI 评估类定义
  - 提示词构建
  - 建议生成

#### 4.4 lib/qualitative-analytics.ts
- **功能**: 定性分析工具
- **主要方法**:
  - `getMostFrequentSuggestions()`: 获取最频繁建议
  - `getCumulativeHighlights()`: 计算累计亮点
  - `analyzeCompetencyLevels()`: 分析能力等级

### 5. 组件数据流

#### 5.1 面试练习组件 (interview-practice.tsx)
```
组件初始化 → 获取问题数据 → 用户交互 → 
状态更新 → AI 评估 → 结果展示
```

#### 5.2 学习报告组件 (learning-report/)
```
page.tsx (服务端) → 数据获取 → client.tsx (客户端) → 
数据处理 → 图表渲染 → 用户交互
```

#### 5.3 练习历史组件 (practice-history/)
```
历史数据查询 → 数据过滤和分组 → 统计计算 → 
列表渲染 → 详情查看
```

### 6. 数据安全和权限

#### RLS (Row Level Security) 策略
- **私有表策略**: 用户只能访问自己的数据
- **公共表策略**: 所有认证用户可读取公共数据
- **权限配置**: anon 和 authenticated 角色权限设置

### 7. 数据优化建议

#### 7.1 当前问题
1. 模拟数据分散在多个文件中
2. 部分数据硬编码在组件中
3. 缺乏统一的数据管理策略

#### 7.2 优化方案
1. **集中化数据管理**: 创建统一的数据配置文件
2. **环境区分**: 开发环境使用模拟数据，生产环境使用真实数据
3. **数据缓存**: 实现客户端数据缓存机制
4. **类型安全**: 完善 TypeScript 类型定义

### 8. 开发和测试

#### 8.1 数据初始化
```bash
# 应用数据库脚本
npm run db:setup

# 或手动执行
supabase db reset
supabase db push
```

#### 8.2 数据验证
- 使用 scripts/VERIFY_DATABASE_SETUP.sql 验证数据完整性
- 检查 RLS 策略是否正确应用
- 验证权限配置

### 9. 监控和维护

#### 9.1 数据监控
- Supabase Dashboard 监控数据库性能
- 查询日志分析
- 错误日志跟踪

#### 9.2 数据备份
- 定期数据库备份
- 重要配置文件版本控制
- 灾难恢复计划

---

## 总结

FutureU 项目采用了清晰的数据分层架构，通过 Supabase 提供后端服务，Next.js 处理前端逻辑。数据流从数据库到组件层层传递，确保了数据的一致性和安全性。建议继续优化数据管理策略，提升开发效率和用户体验。