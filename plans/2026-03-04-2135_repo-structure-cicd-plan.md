# Ponylab 仓库结构与 CI/CD 方案

## 创建时间: 2026-03-04-2135

---

## 1. 仓库结构（Turborepo Monorepo）

```
ponylab/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                    # PR CI 检查
│   │   ├── cd-staging.yml            # Staging 部署
│   │   ├── cd-production.yml         # Production 部署
│   │   ├── prd-review.yml            # PRD 文档变更时触发审查
│   │   └── release.yml               # 版本发布
│   ├── PULL_REQUEST_TEMPLATE.md
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.yml
│   │   ├── feature_request.yml
│   │   └── prd_update.yml
│   └── dependabot.yml
│
├── apps/
│   ├── web/                          # Next.js 15 前端应用
│   │   ├── src/
│   │   │   ├── app/                  # App Router 页面
│   │   │   ├── components/           # 页面级组件
│   │   │   ├── hooks/                # 自定义 hooks
│   │   │   ├── lib/                  # 工具函数
│   │   │   ├── stores/               # Zustand stores
│   │   │   └── types/                # TypeScript 类型
│   │   ├── public/
│   │   ├── next.config.ts
│   │   ├── tailwind.config.ts
│   │   └── package.json
│   │
│   └── api/                          # NestJS 后端 API
│       ├── src/
│       │   ├── modules/              # 功能模块
│       │   │   ├── auth/             # 认证授权
│       │   │   ├── experiment/       # 实验记录
│       │   │   ├── sample/           # 样品管理
│       │   │   ├── inventory/        # 库存管理
│       │   │   ├── protocol/         # 协议/SOP
│       │   │   ├── instrument/       # 仪器管理
│       │   │   ├── team/             # 团队协作
│       │   │   ├── audit/            # 审计追踪
│       │   │   ├── report/           # 报告系统
│       │   │   ├── ai/               # AI 功能
│       │   │   ├── notification/     # 通知系统
│       │   │   ├── file/             # 文件管理
│       │   │   └── admin/            # 系统管理
│       │   ├── common/               # 通用模块
│       │   │   ├── guards/
│       │   │   ├── decorators/
│       │   │   ├── filters/
│       │   │   ├── interceptors/
│       │   │   └── pipes/
│       │   ├── config/               # 配置
│       │   └── main.ts
│       ├── prisma/
│       │   ├── schema.prisma         # 数据库 schema
│       │   └── migrations/
│       ├── test/                     # E2E 测试
│       └── package.json
│
├── packages/
│   ├── ui/                           # 共享 UI 组件库
│   │   ├── src/
│   │   │   ├── components/           # 原子/分子组件
│   │   │   ├── styles/               # 设计 tokens
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── database/                     # Prisma client + 类型
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── package.json
│   │
│   ├── shared/                       # 共享类型和工具
│   │   ├── src/
│   │   │   ├── types/
│   │   │   ├── utils/
│   │   │   └── constants/
│   │   └── package.json
│   │
│   ├── ai/                           # AI 服务封装
│   │   ├── src/
│   │   │   ├── llm/                  # LLM 客户端
│   │   │   ├── embedding/            # 向量化
│   │   │   ├── rag/                  # RAG 管道
│   │   │   └── agents/               # AI Agent
│   │   └── package.json
│   │
│   └── eslint-config/                # 共享 ESLint 配置
│       └── package.json
│
├── docs/
│   ├── prd/                          # PRD 文档（版本化）
│   │   ├── YYYY-MM-DD-HHmm_prd-v{X}.md
│   │   └── CHANGELOG.md
│   ├── api/                          # API 文档（自动生成）
│   ├── architecture/                 # 架构文档
│   └── deployment/                   # 部署文档
│
├── infra/
│   ├── docker/
│   │   ├── Dockerfile.web
│   │   ├── Dockerfile.api
│   │   └── docker-compose.yml
│   ├── k8s/                          # Kubernetes 配置
│   └── terraform/                    # 基础设施即代码
│
├── scripts/
│   ├── setup.sh                      # 开发环境初始化
│   ├── seed.sh                       # 数据库 seed
│   └── release.sh                    # 版本发布
│
├── turbo.json                        # Turborepo 配置
├── package.json                      # Root package.json
├── pnpm-workspace.yaml               # pnpm workspace
├── tsconfig.json                     # Root TypeScript 配置
├── .env.example
├── .gitignore
├── CLAUDE.md                         # Claude Code 项目指引
├── LICENSE
└── README.md
```

---

## 2. 技术栈选型

| 层级           | 技术                     | 理由                                   |
| -------------- | ------------------------ | -------------------------------------- |
| **前端**       | Next.js 15 + React 19    | SSR/SSG、App Router、Server Components |
| **UI 框架**    | Tailwind CSS + shadcn/ui | 快速开发 + 高质量组件                  |
| **富文本**     | TipTap (ProseMirror)     | 可扩展的实验记录编辑器                 |
| **状态管理**   | Zustand + TanStack Query | 轻量 + 服务端状态管理                  |
| **后端**       | NestJS 11                | 模块化、装饰器、TypeScript 原生        |
| **ORM**        | Prisma 6                 | 类型安全、迁移管理                     |
| **数据库**     | PostgreSQL 16            | JSONB、全文搜索、GIS                   |
| **缓存**       | Redis 7                  | Session、缓存、实时                    |
| **搜索**       | Meilisearch              | 快速全文搜索、中文支持                 |
| **文件存储**   | S3/MinIO                 | 对象存储                               |
| **消息队列**   | BullMQ (Redis)           | 后台任务处理                           |
| **实时通信**   | Socket.IO                | 实时协作                               |
| **AI**         | Claude API + OpenAI      | LLM 推理                               |
| **向量数据库** | pgvector                 | PostgreSQL 原生向量搜索                |
| **认证**       | Passport.js + JWT        | 灵活的认证策略                         |
| **测试**       | Vitest + Playwright      | 单元测试 + E2E                         |
| **Monorepo**   | Turborepo + pnpm         | 构建缓存 + workspace                   |
| **部署**       | Docker + Vercel/Railway  | 容器化部署                             |

---

## 3. CI/CD 方案

### 3.1 PR 检查流程（ci.yml）

```yaml
触发: push/PR to main, develop
步骤: 1. Lint（ESLint + Prettier）
  2. Type Check（tsc --noEmit）
  3. Unit Tests（Vitest）
  4. Build（turbo build）
  5. E2E Tests（Playwright，仅 main PR）
  6. Prisma Schema 验证
  7. 安全扫描（npm audit）
  8. 覆盖率报告
```

### 3.2 自动合并规则

- 所有 CI 检查通过
- 至少 1 个 review approval
- 无 merge conflicts
- 覆盖率不降低

### 3.3 版本发布策略

- **Semantic Versioning**: MAJOR.MINOR.PATCH
- **Changesets**: 自动版本管理和 CHANGELOG 生成
- **Release Branches**: main → production, develop → staging
- **Tag-based Releases**: v1.0.0 tag 触发 production 部署

### 3.4 PRD 文档迭代方案

- PRD 修改通过 PR 提交（docs/prd/ 下）
- 自动触发 prd-review.yml
  - 检查文档完整性
  - 检查时间戳格式
  - 自动生成 diff 摘要
  - 要求 review 审批
- 合并后自动更新 CHANGELOG.md

---

## 4. 分支策略

```
main (production)
├── develop (staging)
│   ├── feature/experiment-module
│   ├── feature/sample-management
│   ├── fix/auth-bug
│   └── docs/prd-v2
```

- **main**: 生产分支，仅通过 PR 合并
- **develop**: 开发分支，功能集成
- **feature/\***: 功能分支
- **fix/\***: 修复分支
- **docs/\***: 文档分支

---

## 5. 文档时间戳规范

所有文档文件名必须包含精确到分的时间戳：

- 格式: `YYYY-MM-DD-HHmm_{简述}.md`
- 示例: `2026-03-04-2135_prd-v1.md`
- 时区: 本地时区（CST/UTC+8）
