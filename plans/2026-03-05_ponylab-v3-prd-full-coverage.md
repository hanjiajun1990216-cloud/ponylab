# PonyLab V3 PRD — 竞品功能 100% 覆盖 完整实施方案

**版本**: 3.0 (全功能版)
**日期**: 2026-03-05
**基于**: plans/2026-03-05-0700_ponylab-v2-competitive-gap-analysis.md
**当前覆盖率**: ~58% (Sprint 1 已合并)
**目标覆盖率**: 100% (含所有竞品功能 + 差异化功能, 零跳过)

---

## 一、背景与目标

### 1.1 现状

PonyLab V2 综合功能覆盖率 45%。Sprint 1 已完成 RBAC 部署、版本历史、低库存通知、CSV 导出等 7 项修复，覆盖率提升至 ~58%。

### 1.2 关键发现

代码审查发现以下致命差距：

- **`experiments/[id]/page.tsx` 不存在** — 用户无法查看/编辑实验，ELN 核心功能完全缺失
- **TipTap 未安装** — 无富文本编辑器
- **无图表库** — Dashboard/仪器统计无法可视化
- **ExperimentStatus DTO 仅 3 值** — schema 有 8 个状态但 DTO 只暴露 DRAFT/IN_PROGRESS/COMPLETED
- **大量 Prisma model 已定义但无 API/UI**：ExperimentTemplate、ProtocolExecution、InventoryColumn、StorageLocation 层级、TaskDependency 创建、TaskParticipant 等

### 1.3 目标

通过 6 个 Sprint (S2-S7) 将覆盖率从 58% 提升至 100%，覆盖竞品分析报告中的全部 95 个功能点，零跳过。

---

## 二、技术架构

### 2.1 技术栈

- **后端**: NestJS 11 + Prisma + PostgreSQL
- **前端**: Next.js 15 + React 19 + Tailwind CSS 3.4
- **状态管理**: Zustand + TanStack Query
- **已有关键库**: reactflow, dnd-kit, react-big-calendar, date-fns
- **AI**: @anthropic-ai/sdk (packages/ai, 已 scaffold 未使用)

### 2.2 新增依赖规划

| 包                                               | 用途                 | Sprint |
| ------------------------------------------------ | -------------------- | ------ |
| @tiptap/react + 10 扩展                          | ELN 富文本编辑器     | 2      |
| @tiptap/extension-code-block-lowlight + lowlight | 代码块 (Python/R)    | 2      |
| ketcher-react + ketcher-standalone               | 化学结构编辑器       | 2      |
| recharts                                         | 图表可视化           | 2      |
| qrcode + @types/qrcode                           | QR 码生成            | 2      |
| @nestjs/schedule                                 | 定时任务（预约提醒） | 3      |
| react-image-annotate                             | 图片标注             | 3      |
| gantt-task-react                                 | 甘特图视图           | 4      |
| jspdf + @jspdf/autotable                         | PDF 报告导出         | 5      |
| passport-saml                                    | SSO/SAML 认证        | 6      |
| @capacitor/core + @capacitor/cli                 | 移动端 App 包装      | 7      |

### 2.3 Prisma Schema 现有但未使用的 Model

| Model                  | Schema 状态 | API 状态    | UI 状态           |
| ---------------------- | ----------- | ----------- | ----------------- |
| ExperimentTemplate     | ✅ 完整     | ❌ 无模块   | ❌ 无页面         |
| ExperimentSnapshot     | ✅ 完整     | ✅ Sprint 1 | ❌ 需详情页展示   |
| ProtocolExecution      | ✅ 完整     | ❌ 无端点   | ❌ 无 UI          |
| ProtocolExecutionStep  | ✅ 完整     | ❌ 无端点   | ❌ 无 UI          |
| InventoryColumn        | ✅ 完整     | ❌ 无端点   | ❌ 无 UI          |
| TaskDependency         | ✅ 完整     | ✅ 只读渲染 | ❌ 无创建/删除 UI |
| TaskParticipant        | ✅ 完整     | ❌ 无端点   | ❌ 无 UI          |
| TaskInventoryUsage     | ✅ 完整     | ❌ 无端点   | ❌ 无 UI          |
| StorageLocation        | ✅ 8级层级  | ❌ 无树查询 | ❌ 无 UI          |
| NotificationPreference | ✅ 完整     | ❌ 无端点   | ❌ 无 UI          |

---

## 三、Sprint 1 回顾（已完成 ✅）

**PR #1**: V2 E2E + Bug Fix | **PR #2**: V3 Sprint 1
**覆盖率**: 45% → 58%

| #   | 功能                                            | 状态            |
| --- | ----------------------------------------------- | --------------- |
| 1   | RBAC Guard 全面部署（12 controller + 3 新权限） | ✅ 已合并       |
| 2   | 仪器日历字段修复（purpose → title）             | ✅ 已合并       |
| 4   | 实验版本历史（ExperimentSnapshot）              | ✅ 已合并       |
| 5   | 任务看板拖拽修复                                | ✅ 已合并       |
| 6   | 低库存预警通知                                  | ✅ 已合并       |
| 7   | Dashboard 低库存 API 修正                       | ✅ 已合并       |
| 10  | DAG 画布视图（已有 ReactFlow）                  | ✅ 确认无需改动 |
| 17  | CSV 数据导出（ExportModule 3 端点）             | ✅ 已合并       |

---

## 四、Sprint 2 — ELN 编辑器核心 (58% → 70%)

**分支**: `feat/v3-sprint2-eln-editor`
**并行 Agent**: 3 个

### 4.1 Agent A: 实验详情页 + TipTap 编辑器

**新建文件**:

- `apps/web/src/app/(dashboard)/experiments/[id]/page.tsx` — 实验详情主页
- `apps/web/src/components/ELNEditor.tsx` — TipTap 编辑器封装
- `apps/web/src/components/ExperimentStatusFlow.tsx` — 状态流转可视化

**页面结构**:

```
ExperimentDetailPage
├── ExperimentHeader（标题编辑、状态 badge、操作按钮组）
│   ├── 签名按钮（COMPLETED → SIGNED）
│   ├── 提交按钮（IN_PROGRESS → SUBMITTED）
│   ├── 导出 PDF（调 export 端点）
│   └── 版本历史下拉
├── TabbedPanel
│   ├── EditorTab — TipTap 富文本编辑器（主体）
│   │   ├── 工具栏：粗/斜/标题/列表/表格/图片/清单/公式
│   │   ├── 内容自动保存（500ms debounce）
│   │   └── 状态指示器：已保存/保存中/错误
│   ├── TasksTab — 关联任务列表（可创建新任务）
│   ├── ResultsTab — 实验结果（数值/表格/图表类型）
│   ├── SamplesTab — 关联样品列表
│   ├── FilesTab — 附件上传/下载
│   └── HistoryTab — ExperimentSnapshot 版本列表
└── 签名面板（SUBMITTED 状态时弹出，见证人可见）
```

**TipTap 扩展配置**:

- StarterKit（基础格式、标题、列表等）
- Table（表格支持）
- Image（图片插入）
- Mention（@团队成员，需 suggestion 配置）
- TaskList + TaskItem（清单/Checklist）
- Placeholder（空内容提示）
- CharacterCount（字数统计）
- CodeBlockLowlight + lowlight（代码块，支持 Python/R/SQL 语法高亮）
- 自定义 KetcherNode（化学结构编辑器，嵌入 ketcher-react 为 TipTap NodeView）

**修改文件**:

- `apps/web/src/app/(dashboard)/experiments/page.tsx` — 卡片添加 `<Link href={/experiments/${id}}>`

### 4.2 Agent B: 实验完整状态工作流 API

**ExperimentStatus 枚举扩展**（从 3 → 8）:

```
DRAFT → IN_PROGRESS → COMPLETED → SUBMITTED → SIGNED → WITNESSED → ARCHIVED
                                      ↓
                                   REJECTED → (回到 DRAFT)
```

**新增 Service 方法**:
| 方法 | 转换 | 业务逻辑 |
|---|---|---|
| `submit(id, userId)` | COMPLETED → SUBMITTED | 验证实验完整性 |
| `witness(id, witnessId)` | SIGNED → WITNESSED | 验证见证人有 ELN_WITNESS 角色 |
| `reject(id, userId, reason)` | SUBMITTED/SIGNED → REJECTED | 记录 rejectReason |
| `archive(id, userId)` | WITNESSED → ARCHIVED | 最终归档 |

**新增 Controller 端点**:

- `POST /experiments/:id/submit`
- `POST /experiments/:id/witness`
- `POST /experiments/:id/reject` (body: { reason })
- `POST /experiments/:id/archive`

**修改文件**:

- `apps/api/src/modules/experiment/dto/update-experiment.dto.ts`
- `apps/api/src/modules/experiment/experiment.service.ts`
- `apps/api/src/modules/experiment/experiment.controller.ts`
- `apps/web/src/lib/api.ts`

### 4.3 Agent C: 实验模板模块

**新建 API 模块** (`experiment-template`):

- `GET /experiment-templates?teamId=&isPublic=` — 列表（支持团队+公开双过滤）
- `GET /experiment-templates/:id` — 详情
- `POST /experiment-templates` — 创建
- `DELETE /experiment-templates/:id` — 删除

**新建前端页面**:

- `apps/web/src/app/(dashboard)/experiments/templates/page.tsx` — 模板库
  - 模板卡片列表（名称、分类、作者）
  - "从模板创建实验"按钮
  - "保存当前实验为模板"功能

**修改文件**:

- `apps/api/src/app.module.ts` — 注册 ExperimentTemplateModule
- `apps/web/src/lib/api.ts` — 新增模板 API 方法

### 4.4 覆盖的竞品功能点

| 维度 | 功能点                   | 覆盖状态                         |
| ---- | ------------------------ | -------------------------------- |
| ELN  | 富文本编辑器（TipTap）   | ✅ 新增                          |
| ELN  | 版本历史 UI 展示         | ✅ HistoryTab                    |
| ELN  | 完整状态机（8态）        | ✅ DTO 扩展                      |
| ELN  | 实验模板库               | ✅ 新模块                        |
| ELN  | 实验标签/分类            | ✅ 已有 ExperimentTag            |
| ELN  | 附件上传                 | ✅ FilesTab                      |
| ELN  | @提及                    | ✅ TipTap Mention                |
| ELN  | 表格+公式                | ✅ TipTap Table                  |
| ELN  | 化学结构编辑             | ✅ KetcherNode (TipTap NodeView) |
| ELN  | 代码块 Python/R/SQL      | ✅ CodeBlockLowlight             |
| 权限 | 见证人签署流程           | ✅ witness 端点                  |
| 权限 | SUBMITTED/WITNESSED 状态 | ✅ 状态扩展                      |

---

## 五、Sprint 3 — 协议执行 + 样品详情 + 仪器闭环 (70% → 82%)

**分支**: `feat/v3-sprint3-protocol-sample-instrument`
**并行 Agent**: 4 个

### 5.1 Agent A: ProtocolExecution 模块

**新建 API 模块** (`protocol-execution`):

| 端点                                              | 方法              | 说明                        |
| ------------------------------------------------- | ----------------- | --------------------------- |
| `POST /tasks/:taskId/protocol-execution`          | startExecution    | 创建执行实例 + 复制协议步骤 |
| `GET /tasks/:taskId/protocol-execution`           | findByTask        | 获取执行状态含所有步骤      |
| `PATCH /protocol-executions/:id/steps/:stepIndex` | updateStep        | 更新单步状态/备注/偏差      |
| `POST /protocol-executions/:id/complete`          | completeExecution | 标记整个执行完成            |

**前端 UI**:

- `tasks/[id]/page.tsx` 新增 "协议执行" Tab
  - 步骤清单：每步可标记 PENDING/IN_PROGRESS/COMPLETED/SKIPPED
  - 每步可填写备注 (notes) 和偏差记录 (deviations)
  - 完成按钮：所有步骤 COMPLETED/SKIPPED 后可点

### 5.2 Agent B: 样品详情页 + QR 码

**新建文件**:

- `apps/web/src/app/(dashboard)/samples/[id]/page.tsx`
- `apps/web/src/components/QRCodeDisplay.tsx`

**样品详情页结构**:

```
SampleDetailPage
├── Header（名称、条码、状态 badge）
├── QR 码显示（qrcode 库生成 DataURL）
├── InfoPanel（类型、存储位置、关联实验、创建者）
├── EventTimeline（SampleEvent 时间线，图标区分事件类型）
├── MetadataPanel（JSON metadata 键值展示）
└── ActionsBar
    ├── 借出（CHECKED_OUT）
    ├── 归还（CHECKED_IN）
    ├── 消耗（CONSUMED）
    ├── 处置（DISPOSED）
    └── 转移（MOVED + 新 storageId）
```

**修改文件**:

- `apps/web/src/app/(dashboard)/samples/page.tsx` — 添加 Link 跳转
- `apps/web/src/lib/api.ts` — 新增 getSample, updateSample, addSampleEvent
- 后端 `sample.controller.ts` — 新增 `POST /samples/:id/events`

### 5.3 Agent C: 仪器维护记录 + 统计图表

**替换两个 placeholder Tab**:

**维护记录 Tab**:

- 维护记录列表（类型、描述、执行日期、下次维护、费用）
- 创建表单：类型（校准/保养/维修/清洁）、描述、日期、费用
- 新增端点：`POST /instruments/:id/maintenance`

**使用统计 Tab**:

- recharts 柱状图：近 30 天每日预约次数
- 饼图：各用户使用占比
- 数字指标：总预约数、平均利用率、本月小时数
- 新增端点：`GET /instruments/:id/stats`

### 5.4 Agent D: 预约提醒通知 (Cron) + 图片标注

**安装**: `@nestjs/schedule`

**新建文件**: `booking-reminder.service.ts`

```typescript
@Cron('0 * * * *') // 每小时执行
async sendBookingReminders() {
  // 查找 24h 内的 CONFIRMED 预约
  // 去重（已通知的不重复发送）
  // 调用 notificationService.create()
}
```

**修改**: `app.module.ts` 全局注册 ScheduleModule.forRoot()

**图片标注** (react-image-annotate):

- 新建组件: `apps/web/src/components/ImageAnnotator.tsx`
- 封装 react-image-annotate，支持矩形/圆形/多边形标注
- 集成到实验详情页 FilesTab：图片附件点击 → 标注模式
- 标注数据保存到 ExperimentFile.metadata JSON 字段

### 5.5 覆盖的竞品功能点

| 维度     | 功能点                           |
| -------- | -------------------------------- |
| Protocol | 步骤执行记录（逐步打卡）         |
| Protocol | 偏差记录                         |
| Protocol | 任务-协议关联执行                |
| 样品     | 样品追踪（全生命周期）           |
| 样品     | 链式监管（Chain of Custody）     |
| 样品     | 样品事件日志                     |
| 样品     | QR 码生成                        |
| 仪器     | 维护记录管理 UI                  |
| 仪器     | 使用统计/利用率图表              |
| 仪器     | 预约提醒通知                     |
| ELN      | 图片标注（react-image-annotate） |

---

## 六、Sprint 4 — 库存定制列 + 任务增强 + AI 助手 (82% → 92%)

**分支**: `feat/v3-sprint4-inventory-task-ai`
**并行 Agent**: 4 个

### 6.1 Agent A: InventoryColumn (自定义列)

**端点**:

- `GET /inventory/columns?teamId=` — 获取团队列定义
- `POST /inventory/columns` — 创建列 (name, type:ColumnType, options?, isRequired)
- `DELETE /inventory/columns/:id` — 删除列

**前端**: `inventory/page.tsx`

- 动态表头（根据列定义渲染）
- 物品值存储在 `InventoryItem.metadata` JSON 字段
- "管理列" 按钮打开弹窗（添加/删除/排序）

### 6.2 Agent B: 任务完整性增强 + 甘特图

**5 个子功能**:

| 功能                | API 变更                                    | UI 变更                     |
| ------------------- | ------------------------------------------- | --------------------------- |
| TaskParticipant     | POST/DELETE /tasks/:id/participants/:userId | 任务详情 → 参与者列表       |
| TaskDependency 创建 | (已有只读)                                  | ReactFlow 画布连线创建/删除 |
| 里程碑标记          | isMilestone 已有                            | 创建表单开关 + 画布菱形图标 |
| TaskInventoryUsage  | POST /tasks/:id/inventory-usage             | 任务详情 → "耗材使用" Tab   |
| **甘特图视图**      | GET /projects/:id/tasks?view=gantt          | gantt-task-react 组件       |

**甘特图**:

- 新建组件: `apps/web/src/components/GanttView.tsx`
- 安装 `gantt-task-react` 库
- 项目详情页新增 "甘特图" 视图 Tab（与 Kanban/DAG 并列）
- 数据映射：Task.startDate → start, Task.dueDate → end, TaskDependency → dependencies
- 支持拖拽调整时间范围（PATCH /tasks/:id 更新日期）

### 6.3 Agent C: AI 实验助手 (Claude API) — 全功能版

**新建 API 模块** (`ai`):

| 端点                              | 功能                                                    |
| --------------------------------- | ------------------------------------------------------- |
| `POST /ai/experiment/:id/chat`    | 实验上下文对话（含 RAG、报告生成、自然语言查询）        |
| `POST /ai/protocol/parse`         | PDF 文本 → 结构化协议步骤                               |
| `POST /ai/transcribe`             | 语音转录（Web Speech API 前端 + Claude 后处理）         |
| `POST /ai/inventory/forecast`     | 库存消耗预测（历史 transaction 数据 → Claude 趋势分析） |
| `POST /ai/experiment/:id/anomaly` | 异常数据检测（结果数据 → Claude 统计分析）              |
| `POST /ai/vision/analyze`         | 图像识别（图片 Base64 → Claude Vision API）             |

**实现**:

- 使用 `packages/ai` 的 `createAIClient()` (已有 Anthropic SDK)
- **实验对话**: 组装上下文（标题、内容摘要、任务、结果）→ Claude 消息，支持 RAG（实验内容作上下文）
- **协议解析**: PDF 文本 → Claude 提取步骤 JSON
- **语音转录**: 前端用 Web Speech API (SpeechRecognition) 实时转录 → 后端 Claude 润色/纠错科学术语
- **库存消耗预测**: 聚合近 N 月 InventoryTransaction 数据 → Claude 分析消耗趋势 → 返回预测天数和建议补货量
- **异常数据检测**: 收集实验 ExperimentResult 数据 → Claude 统计分析（z-score、趋势异常）→ 返回异常标记
- **图像识别**: 前端上传图片 → Base64 编码 → Claude Vision API 分析（凝胶电泳/显微镜/西方印迹等）

**前端**:

- `apps/web/src/components/AIAssistantPanel.tsx` — 侧边对话框
  - 对话历史、消息输入、发送
  - 快捷提问：解释结果 | 生成摘要 | 推荐后续实验 | 异常检测
- `apps/web/src/components/VoiceInput.tsx` — 语音输入按钮（Web Speech API）
- `apps/web/src/components/ImageAnalyzer.tsx` — 图片上传 + AI 分析结果展示
- 实验详情页右下角浮动 AI 按钮
- Dashboard "库存消耗预测" 卡片（调用 /ai/inventory/forecast）

### 6.4 Agent D: 仪器多维日历 + Dashboard 增强

**仪器 Resource View**:

- `instruments/page.tsx` 新增 "时间线" 视图切换
- react-big-calendar resource mode (纵轴=仪器, 横轴=时间)
- 新增端点：`GET /instruments/bookings/today`

**Dashboard 增强**:

- 新增 "今日仪器预约" 卡片
- 新增 "团队近期动态" 区块（调用 GET /audit）

### 6.5 覆盖的竞品功能点

| 维度       | 功能点                                              |
| ---------- | --------------------------------------------------- |
| 库存       | 自定义列（类型：文本/数字/日期/下拉/文件/条码/URL） |
| 项目管理   | 任务参与者多人                                      |
| 项目管理   | 任务依赖关系创建                                    |
| 项目管理   | 任务里程碑                                          |
| 项目管理   | **甘特图视图**（gantt-task-react）                  |
| 库存       | 库存与任务自动扣减                                  |
| AI         | AI 对话助手（Chat + RAG）                           |
| AI         | 协议 PDF AI 解析                                    |
| AI         | 实验报告自动生成（通过 Chat）                       |
| AI         | 自然语言数据查询（通过 Chat）                       |
| AI         | **语音转录**（Web Speech API + Claude）             |
| AI         | **库存消耗预测**（Claude 趋势分析）                 |
| AI         | **异常数据检测**（Claude 统计分析）                 |
| AI         | **图像识别**（Claude Vision API）                   |
| 数据可视化 | 仪器使用率图表                                      |
| 数据可视化 | 今日预约区块                                        |
| 数据可视化 | 团队动态流                                          |
| 仪器       | 资源视图（纵轴多仪器）                              |

---

## 七、Sprint 5 — 存储层级 + PDF 导出 + 通知偏好 + 审批 (92% → 96%)

**分支**: `feat/v3-sprint5-storage-pdf-approval`
**并行 Agent**: 3 个

### 7.1 Agent A: 存储层级 UI

**StorageLocation 树（8级递归: ROOM→FREEZER→REFRIGERATOR→SHELF→RACK→BOX→DRAWER→CABINET）**

**新增端点**:

- `GET /storage/tree` — 完整层级树
- `POST /storage` — 创建节点
- `GET /storage/:id/contents` — 某位置内样品

**新建组件**: `StorageTree.tsx`

- 可折叠树形展示
- 每节点显示：名称、类型图标、温度、容量、样品数
- 点击节点 → 右侧展示该位置样品列表

**修改**: `samples/page.tsx` 新增 "存储视图" Tab

### 7.2 Agent B: PDF/Word 报告导出

**安装**: jspdf + @jspdf/autotable

**新增端点**:

- `GET /export/experiment/:id/pdf` — 实验完整 PDF 报告
- `GET /export/project/:id/report` — 项目汇总报告 PDF

**PDF 内容**: 实验标题、作者、状态、签名信息、正文内容（HTML→文本）、任务列表、结果表格

**前端**: 实验详情页 Header + "导出 PDF" 按钮

### 7.3 Agent C: 通知偏好 + 预约审批

**通知偏好** (NotificationPreference):

- `GET /notifications/preferences` — 获取偏好列表
- `PATCH /notifications/preferences/:type` — 更新 email/inApp 开关
- `settings/page.tsx` 新增通知偏好 Tab

**预约审批** (Instrument.requiresApproval):

- `createBooking()` 检查 requiresApproval → 设为 PENDING
- `POST /instruments/bookings/:id/approve` — 审批通过
- `POST /instruments/bookings/:id/reject` — 拒绝
- 日历中 PENDING 预约显示橙色 + 管理员审批按钮

### 7.4 覆盖的竞品功能点

| 维度       | 功能点                             |
| ---------- | ---------------------------------- |
| 样品       | 存储定位（冰箱/架子/位置 8级层级） |
| 样品       | 样品条码 QR（存储视图内展示）      |
| 数据可视化 | PDF/Word 报告导出                  |
| 仪器       | 预约审批流程                       |
| 集成       | 通知偏好设置                       |
| 库存       | PDF 标签打印（via jspdf）          |

---

## 八、Sprint 6 — 合规 + SSO + Webhook + 收尾 (96% → 99%)

**分支**: `feat/v3-sprint6-compliance-sso`
**并行 Agent**: 3 个

### 8.1 Agent A: 21 CFR Part 11 合规

| 要求             | 实现                                  |
| ---------------- | ------------------------------------- |
| 电子签名身份验证 | sign/witness 端点增加密码确认参数     |
| 不可篡改审计链   | 每条 AuditLog 计算前一条 SHA-256 hash |
| 审计链验证       | `GET /audit/verify-chain` 端点        |
| 签署后防篡改     | lockedAt 校验（SIGNED 后禁止 update） |
| 见证人权限验证   | witness 端点检查 ELN_WITNESS 功能角色 |

### 8.2 Agent B: SSO/SAML

**安装**: passport-saml

**新建文件**:

- `apps/api/src/modules/auth/saml.strategy.ts`
- `apps/api/src/modules/auth/dto/saml-config.dto.ts`

**端点**:

- `GET /auth/saml/login` — 重定向到 IdP
- `POST /auth/saml/callback` — 处理 IdP 回调
- `GET /auth/saml/metadata` — SP metadata XML

**配置**: 环境变量 `SAML_ENTRY_POINT`, `SAML_ISSUER`, `SAML_CERT`

**前端**: 登录页新增 "SSO 登录" 按钮

### 8.3 Agent C: Webhook + 杂项收尾

**Webhook 模块**:

- 新建 `webhook/` 模块 (module + service + controller)
- `POST /webhooks` — 注册 (url, events[], secret)
- `GET /webhooks` — 列表
- `DELETE /webhooks/:id` — 删除
- 在关键事件（签名、低库存、预约确认）时 HTTP POST

**协议版本更新通知**:

- `createVersion()` 后通知协议的执行者

**协议双库**:

- `getProtocols()` 支持 personal (authorId=userId) + team (teamId) 双过滤

**IP 白名单** (NestJS middleware):

- 新建 `apps/api/src/common/middleware/ip-whitelist.middleware.ts`
- 配置：环境变量 `IP_WHITELIST=192.168.1.0/24,10.0.0.0/8` (逗号分隔 CIDR)
- 全局 middleware 或 module 级别注册
- 不在白名单内 → 403 Forbidden（仅对 API 端点生效，不影响健康检查）
- 空白名单 = 不启用（默认关闭，向后兼容）

**移动端响应式**:

- Dashboard layout 侧边栏 <768px 折叠
- Hamburger 菜单按钮

### 8.4 覆盖的竞品功能点

| 维度     | 功能点                             |
| -------- | ---------------------------------- |
| 合规     | 21 CFR Part 11 完整流程            |
| 合规     | 电子签名（合规级）                 |
| 合规     | 不可篡改审计追踪 (hash 链)         |
| 集成     | SSO/SAML                           |
| 集成     | Webhook                            |
| 集成     | **IP 白名单**（NestJS middleware） |
| 集成     | 响应式 Web 改善                    |
| Protocol | 个人+团队双库                      |
| Protocol | 协议版本更新通知                   |

---

## 九、Sprint 7 — 移动端原生 App + FedRAMP 文档 (99% → 100%)

**分支**: `feat/v3-sprint7-mobile-app`
**并行 Agent**: 2 个

### 9.1 Agent A: Capacitor 移动端 App

**安装**: `@capacitor/core` + `@capacitor/cli` + `@capacitor/ios` + `@capacitor/android`

**初始化**:

```bash
npx cap init PonyLab com.ponylab.app --web-dir apps/web/out
```

**实现步骤**:

1. Next.js 输出模式改为 `output: 'export'`（静态导出）用于 Capacitor
2. `capacitor.config.ts` 配置 server URL（开发时指向 dev server，生产用打包后的静态文件）
3. 添加 iOS/Android 平台：`npx cap add ios && npx cap add android`
4. 适配移动端特性：
   - 安全区域 (safe-area-inset) CSS 变量
   - 触摸优化：按钮最小 44px、滑动手势
   - 相机插件 (`@capacitor/camera`)：用于样品 QR 码扫描
   - 推送通知 (`@capacitor/push-notifications`)：低库存/预约提醒

**新建文件**:

- `capacitor.config.ts` — Capacitor 配置
- `apps/web/src/lib/capacitor.ts` — Capacitor 插件封装（相机/推送/本地存储）
- `apps/web/src/components/MobileScanner.tsx` — QR 码扫描组件

### 9.2 Agent B: FedRAMP 合规文档

**说明**: FedRAMP 是文档合规（非代码功能），生成标准文档模板：

- `docs/compliance/fedramp-ssp.md` — System Security Plan 模板
- `docs/compliance/fedramp-sar.md` — Security Assessment Report 模板
- `docs/compliance/fedramp-poam.md` — Plan of Action and Milestones 模板
- 基于 NIST 800-53 Rev.5 控制项，标注 PonyLab 已实现的安全控制

### 9.3 覆盖的竞品功能点

| 维度 | 功能点                                  |
| ---- | --------------------------------------- |
| 集成 | 移动端原生 App（Capacitor iOS/Android） |
| 合规 | FedRAMP 合规文档模板                    |

---

## 十、覆盖率矩阵（完整追踪）

### 10.1 项目管理 (11 项)

| #   | 功能            | V2  | S1  | S2  | S3  | S4  | S5  | S6  |
| --- | --------------- | --- | --- | --- | --- | --- | --- | --- |
| 1   | 研究方向层级    | ✅  |     |     |     |     |     |     |
| 2   | 四层结构        | ✅  |     |     |     |     |     |     |
| 3   | 任务看板 Kanban | 🔶  | ✅  |     |     |     |     |     |
| 4   | DAG 画布视图    | 🔶  | ✅  |     |     |     |     |     |
| 5   | 甘特图          | ❌  |     |     |     | ✅  |     |     |
| 6   | 任务步骤        | ✅  |     |     |     |     |     |     |
| 7   | 任务里程碑      | ❌  |     |     |     | ✅  |     |     |
| 8   | 任务参与者多人  | 🔶  |     |     |     | ✅  |     |     |
| 9   | 项目进度百分比  | 🔶  | ✅  |     |     |     |     |     |
| 10  | 任务依赖关系    | 🔶  |     |     |     | ✅  |     |     |
| 11  | 留言板          | ✅  |     |     |     |     |     |     |

### 10.2 权限与协作 (9 项)

| #   | 功能           | V2  | S1  | S6  |
| --- | -------------- | --- | --- | --- |
| 1   | 系统角色       | ✅  |     |     |
| 2   | 团队角色       | ✅  |     |     |
| 3   | 功能角色       | 🔶  | ✅  |     |
| 4   | 团队可见性     | ✅  |     |     |
| 5   | 三轨邀请       | ✅  |     |     |
| 6   | 申请加入审批   | ✅  |     |     |
| 7   | SSO/SAML       | ❌  |     | ✅  |
| 8   | 多租户隔离     | 🔶  | ✅  |     |
| 9   | 细粒度权限守卫 | ❌  | ✅  |     |

### 10.3 仪器管理 (11 项)

| #   | 功能         | V2  | S1  | S3  | S4  | S5  |
| --- | ------------ | --- | --- | --- | --- | --- |
| 1   | 仪器 CRUD    | ✅  |     |     |     |     |
| 2   | 预约日历     | 🔶  | ✅  |     |     |     |
| 3   | 资源视图     | ❌  |     |     | ✅  |     |
| 4   | 实时冲突检测 | ✅  |     |     |     |     |
| 5   | 用户颜色标识 | ✅  |     |     |     |     |
| 6   | 预约审批流程 | ❌  |     |     |     | ✅  |
| 7   | 预约提醒     | ❌  |     | ✅  |     |     |
| 8   | 维护记录 UI  | 🔶  |     | ✅  |     |     |
| 9   | 仪器留言板   | ✅  |     |     |     |     |
| 10  | 仪器公告     | ✅  |     |     |     |     |
| 11  | 使用统计图表 | ❌  |     | ✅  |     |     |

### 10.4 ELN 功能 (14 项)

| #   | 功能                | V2  | S1  | S2     | S3  |
| --- | ------------------- | --- | --- | ------ | --- |
| 1   | 富文本编辑器 TipTap | 🔶  |     | ✅     |     |
| 2   | 版本历史            | ❌  | ✅  | ✅(UI) |     |
| 3   | 数字签名            | ✅  |     |        |     |
| 4   | 见证人签署          | ❌  |     | ✅     |     |
| 5   | 签署后锁定          | ✅  |     |        |     |
| 6   | 完整状态机 8态      | 🔶  |     | ✅     |     |
| 7   | 化学结构编辑        | ❌  |     | ✅     |     |
| 8   | 实验模板            | ❌  |     | ✅     |     |
| 9   | @提及               | ❌  |     | ✅     |     |
| 10  | 图片标注            | ❌  |     |        | ✅  |
| 11  | 代码块              | ❌  |     | ✅     |     |
| 12  | 不可篡改审计        | ✅  |     |        |     |
| 13  | 表格+公式           | ❌  |     | ✅     |     |
| 14  | 附件上传            | ✅  |     | ✅(UI) |     |

### 10.5 Protocol 管理 (9 项)

| #   | 功能          | V2  | S3  | S4  | S6  |
| --- | ------------- | --- | --- | --- | --- |
| 1   | 协议 CRUD     | ✅  |     |     |     |
| 2   | 版本控制      | ✅  |     |     |     |
| 3   | 发布状态      | ✅  |     |     |     |
| 4   | 个人+团队双库 | ❌  |     |     | ✅  |
| 5   | 步骤执行记录  | ❌  | ✅  |     |     |
| 6   | 偏差记录      | ❌  | ✅  |     |     |
| 7   | PDF AI 解析   | ❌  |     | ✅  |     |
| 8   | 版本更新通知  | ❌  |     |     | ✅  |
| 9   | 任务-协议关联 | ❌  | ✅  |     |     |

### 10.6 库存管理 (11 项)

| #   | 功能            | V2  | S1  | S4      | S5  |
| --- | --------------- | --- | --- | ------- | --- |
| 1   | 库存 CRUD       | ✅  |     |         |     |
| 2   | 出入库事务日志  | ✅  |     |         |     |
| 3   | 低库存预警      | 🔶  | ✅  |         |     |
| 4   | 条码/QR 码      | 🔶  |     | → S3 QR |     |
| 5   | 自定义列        | ❌  |     | ✅      |     |
| 6   | 供应商/货号管理 | 🔶  |     |         |     |
| 7   | 批次/效期管理   | 🔶  |     |         |     |
| 8   | PDF 标签打印    | ❌  |     |         | ✅  |
| 9   | 库存与任务扣减  | ❌  |     | ✅      |     |
| 10  | 库存公告        | ✅  |     |         |     |
| 11  | 数据导出 CSV    | ❌  | ✅  |         |     |

### 10.7 样品管理 (7 项)

| #   | 功能           | V2       | S3     | S5  |
| --- | -------------- | -------- | ------ | --- |
| 1   | 样品 CRUD      | ✅       |        |     |
| 2   | 样品事件日志   | ✅(后端) | ✅(UI) |     |
| 3   | 存储位置定位   | 🔶       |        | ✅  |
| 4   | 样品条码 QR    | 🔶       | ✅     |     |
| 5   | 样品类型自定义 | 🔶       | ✅     |     |
| 6   | QR 码生成      | ❌       | ✅     |     |
| 7   | 样品详情页     | ❌       | ✅     |     |

### 10.8 AI 功能 (9 项)

| #   | 功能             | V2  | S4  |
| --- | ---------------- | --- | --- |
| 1   | AI 对话助手      | ❌  | ✅  |
| 2   | RAG 知识库       | ❌  | ✅  |
| 3   | 协议 PDF AI 解析 | ❌  | ✅  |
| 4   | 实验报告自动生成 | ❌  | ✅  |
| 5   | 语音转录         | ❌  | ✅  |
| 6   | 库存消耗预测     | ❌  | ✅  |
| 7   | 异常数据检测     | ❌  | ✅  |
| 8   | 图像识别         | ❌  | ✅  |
| 9   | 自然语言查询     | ❌  | ✅  |

### 10.9 数据可视化 (6 项)

| #   | 功能           | V2  | S1  | S3  | S4  | S5  |
| --- | -------------- | --- | --- | --- | --- | --- |
| 1   | 个人仪表盘     | 🔶  | ✅  |     |     |     |
| 2   | 库存预警区块   | ❌  | ✅  |     |     |     |
| 3   | 今日预约区块   | ❌  |     |     | ✅  |     |
| 4   | 团队动态流     | ❌  |     |     | ✅  |     |
| 5   | 图表内嵌编辑器 | ❌  |     |     | ✅  |     |
| 6   | PDF/Word 导出  | ❌  |     |     |     | ✅  |

### 10.10 集成与合规 (10 项)

| #   | 功能           | V2  | S5  | S6         | S7  |
| --- | -------------- | --- | --- | ---------- | --- |
| 1   | REST API       | ✅  |     |            |     |
| 2   | Webhook        | ❌  |     | ✅         |     |
| 3   | SSO/SAML       | ❌  |     | ✅         |     |
| 4   | 移动端 App     | ❌  |     |            | ✅  |
| 5   | 响应式 Web     | 🔶  |     | ✅         |     |
| 6   | 21 CFR Part 11 | 🔶  |     | ✅         |     |
| 7   | 不可篡改审计   | ✅  |     | ✅(hash链) |     |
| 8   | 数据导出       | ❌  | ✅  |            |     |
| 9   | IP 白名单      | ❌  |     | ✅         |     |
| 10  | FedRAMP 文档   | ❌  |     |            | ✅  |

---

## 十一、进度总览

| Sprint | 覆盖率     | 核心产出                                           | Agent 数 |
| ------ | ---------- | -------------------------------------------------- | -------- |
| S1 ✅  | 45% → 58%  | RBAC + 版本历史 + 通知 + 导出                      | 3        |
| **S2** | 58% → 70%  | **ELN 编辑器 + 状态机 + 模板 + 化学结构 + 代码块** | 3        |
| **S3** | 70% → 82%  | **协议执行 + 样品详情 + 仪器闭环 + 图片标注**      | 4        |
| **S4** | 82% → 92%  | **库存定制列 + 任务增强 + 甘特图 + AI 全功能**     | 4        |
| **S5** | 92% → 96%  | **存储层级 + PDF 导出 + 审批**                     | 3        |
| **S6** | 96% → 99%  | **合规 + SSO + Webhook + IP 白名单 + 收尾**        | 3        |
| **S7** | 99% → 100% | **移动端 App (Capacitor) + FedRAMP 文档**          | 2        |

---

## 十二、验证方案

每个 Sprint 完成后:

1. `pnpm typecheck` — 全包类型检查
2. `pnpm lint` + `pnpm format:check` — 代码规范
3. `pnpm build` — 构建验证（Next.js + NestJS）
4. `pnpm test` — 单元测试
5. 推送分支 → 创建 PR → CI 通过 → squash merge to main

---

## 十三、风险与缓解

| 风险                                 | 缓解措施                                    |
| ------------------------------------ | ------------------------------------------- |
| TipTap KaTeX 公式需额外 CSS/字体     | 搭配 katex 包 + CSS import                  |
| jspdf 对复杂 HTML 渲染限制           | 优先纯文本/表格 PDF，复杂布局降级           |
| passport-saml Node 22 兼容性         | 使用 @node-saml/passport-saml 替代          |
| AI 响应延迟                          | 使用 streaming SSE，前端显示打字效果        |
| app.module.ts / api.ts 多 Agent 冲突 | 最后由主线程统一合并共享文件                |
| ketcher-react 包体较大（~15MB）      | 动态 import + Next.js lazy load，不影响首屏 |
| Capacitor + Next.js SSR 不兼容       | 使用 `output: 'export'` 静态导出模式        |
| gantt-task-react 维护频率低          | 封装为独立组件，便于替换                    |
| Web Speech API 浏览器兼容性          | 降级方案：不支持时隐藏语音按钮              |
| Claude Vision API 成本               | 限制每日调用次数，加缓存                    |

---

## 十四、零跳过声明

**本 PRD 覆盖全部 95+ 竞品功能点，零跳过。** 此前被标记为"仅少数竞品有"的 11 项功能已全部纳入：

| 功能                | 实现方案                            | Sprint |
| ------------------- | ----------------------------------- | ------ |
| 甘特图              | gantt-task-react                    | S4     |
| 化学结构编辑        | ketcher-react (TipTap NodeView)     | S2     |
| 图片标注            | react-image-annotate                | S3     |
| 代码块 Python/R/SQL | TipTap CodeBlockLowlight + lowlight | S2     |
| 语音转录            | Web Speech API + Claude 后处理      | S4     |
| 库存消耗预测        | Claude API 趋势分析                 | S4     |
| 异常数据检测        | Claude API 统计分析                 | S4     |
| 图像识别            | Claude Vision API                   | S4     |
| 移动端原生 App      | Capacitor (iOS + Android)           | S7     |
| IP 白名单           | NestJS middleware (CIDR)            | S6     |
| FedRAMP 文档        | NIST 800-53 合规文档模板            | S7     |
