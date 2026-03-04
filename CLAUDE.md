# Ponylab — Claude Code 项目指引

## 项目概述
Ponylab 是一款 AI 原生的开源实验室信息管理系统（LIMS + ELN）。

## 技术栈
- **前端**: Next.js 15 + React 19 + Tailwind CSS + shadcn/ui
- **后端**: NestJS 11 + Prisma 6 + PostgreSQL 16
- **AI**: Claude API + pgvector + Meilisearch
- **Monorepo**: Turborepo + pnpm
- **测试**: Vitest + Playwright

## 项目结构
```
apps/web/     — Next.js 前端
apps/api/     — NestJS 后端
packages/ui/  — 共享 UI 组件库
packages/database/ — Prisma schema + client
packages/shared/   — 共享类型和工具
packages/ai/       — AI 服务封装
```

## 开发命令
```bash
pnpm dev          # 启动开发服务器
pnpm build        # 构建
pnpm test         # 运行测试
pnpm lint         # Lint 检查
pnpm typecheck    # 类型检查
pnpm db:migrate   # 数据库迁移
pnpm db:seed      # 种子数据
```

## 关键规则
- 所有代码使用 TypeScript
- API 使用 REST + OpenAPI 文档
- 数据库变更通过 Prisma Migration
- 审计日志只追加（INSERT only，禁止 UPDATE/DELETE）
- 文件上传到 MinIO（S3 兼容）
- 环境变量不硬编码，使用 .env
- 文档时间戳格式：YYYY-MM-DD-HHmm

## PRD 文档
docs/prd/ 下为产品需求文档，修改需通过 PR 审核。

## 合规注意
- 审计追踪数据不可篡改
- 电子签名需二次密码验证
- 用户密码使用 bcrypt (cost=12)
- 所有 SQL 使用参数化查询（Prisma 自动保证）
