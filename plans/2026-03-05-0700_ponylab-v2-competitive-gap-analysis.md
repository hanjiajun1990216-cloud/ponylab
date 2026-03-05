# PonyLab V2 竞品功能对比 & 差距分析报告

**版本**: 1.0
**日期**: 2026-03-05
**作者**: Jarvis Research Scout
**状态**: 完成

---

## 目录

1. [竞品功能矩阵](#一竞品功能矩阵)
2. [PonyLab V2 已实现功能盘点](#二ponylab-v2-已实现功能盘点)
3. [综合对比矩阵](#三综合对比矩阵)
4. [Top 20 功能差距列表](#四top-20-功能差距列表)
5. [战略分析](#五战略分析)
6. [参考资料](#六参考资料)

---

## 一、竞品功能矩阵

### 1.1 竞品概览

| 产品 | 定位 | 技术栈 | 定价 | 开源 |
|------|------|--------|------|------|
| **Benchling** | 生命科学 ELN+LIMS 行业领导者 | 云原生 SaaS | ~$2,400/用户/年 | 否 |
| **SciNote** | 通用科研 ELN | 云端+自托管 | 按报价 | 核心开源 |
| **eLabFTW** | 开源 ELN | 自托管 PHP | 免费 | 完全开源 |
| **LabArchives** | 学术 ELN | 云端 SaaS | $365/用户/年 | 否 |
| **STARLIMS** | 企业级 LIMS | 高度定制 | $100-500/用户/月 | 否 |

---

### 1.2 功能维度详细对比

#### 维度 1：项目管理

| 功能点 | Benchling | SciNote | eLabFTW | LabArchives | STARLIMS |
|--------|-----------|---------|---------|-------------|---------|
| 项目/实验分层结构 | Projects → Experiments | Projects → Experiments → Tasks | Experiments（扁平） | Notebooks → Pages | Workflows → Samples |
| 四层结构（方向→项目→任务→步骤） | 否 | 部分（3层） | 否 | 否 | 否 |
| 任务看板（Kanban） | 是（通过 Workflows） | 是（Canvas 画布） | 否 | 否 | 是（定制） |
| DAG 依赖图 | 是（Automation Designer） | 是（Canvas 非线性工作流） | 否 | 否 | 是（高度定制） |
| 甘特图 | 否（无原生支持） | 否 | 否 | 否 | 否（需集成） |
| 任务优先级/里程碑 | 是 | 是 | 否 | 否 | 是 |
| 进度追踪（百分比） | 是 | 是 | 否 | 否 | 是 |
| 多视图（列表/看板/画布） | 是 | 是 | 否 | 否 | 部分 |

#### 维度 2：权限与团队协作

| 功能点 | Benchling | SciNote | eLabFTW | LabArchives | STARLIMS |
|--------|-----------|---------|---------|-------------|---------|
| RBAC 角色体系 | 是（多层） | 是（团队/项目级） | 是（团队/条目级） | 是（基础） | 是（高度可定制） |
| 多团队/多租户 | 是 | 是 | 是（单实例多团队） | 是 | 是（企业级） |
| 邀请机制（邮件/链接/邀请码） | 是 | 是（邮件+链接） | 是（邮件） | 是（邮件） | 是 |
| 访客模式（Guest） | 是 | 是 | 否 | 是（60天到期） | 是 |
| IP 白名单 | 是（Enterprise） | 是 | 是（服务器级） | 是 | 是 |
| SSO/SAML | 是 | 是（企业版） | 是（LDAP/SAML） | 是（教育版） | 是 |
| 细粒度资源级权限 | 是 | 是 | 是（条目级权限组） | 部分 | 是 |
| 申请加入流程（需审批） | 否 | 否 | 否 | 否 | 否 |

#### 维度 3：仪器管理

| 功能点 | Benchling | SciNote | eLabFTW | LabArchives | STARLIMS |
|--------|-----------|---------|---------|-------------|---------|
| 仪器资产注册 | 是（通过Registry） | 否（无原生） | 是（Resource DB） | 否 | 是（企业级） |
| 预约日历（Calendar视图） | **否（无原生）** | **否** | **是（Scheduler）** | **否** | 是（部分） |
| 资源视图（横轴时间/纵轴仪器） | 否 | 否 | 否 | 否 | 否 |
| 实时冲突检测 | 否 | 否 | 是（基础） | 否 | 部分 |
| 用户颜色标识 | 否 | 否 | 否 | 否 | 否 |
| 预约审批流程 | 否 | 否 | 否（自助） | 否 | 部分 |
| 维护记录管理 | 是（Calibration记录） | 否 | 否（可手记） | 否 | 是 |
| 仪器留言板 | 否 | 否 | 否 | 否 | 否 |
| 仪器公告 | 否 | 否 | 否 | 否 | 否 |
| 使用统计/利用率 | 是 | 否 | 否 | 否 | 是 |
| 仪器与实验记录关联 | 是 | 否 | 否 | 否 | 是 |

#### 维度 4：ELN 功能

| 功能点 | Benchling | SciNote | eLabFTW | LabArchives | STARLIMS |
|--------|-----------|---------|---------|-------------|---------|
| 富文本编辑器 | 是（高度定制） | 是（Word-like） | 是（TinyMCE） | 是（Word-like） | 是（基础） |
| 版本控制/历史记录 | 是 | 是 | 是 | 是 | 是 |
| 数字签名 | 是 | 是（21 CFR 合规） | 是 | 是（CFR Part 11） | 是 |
| 见证人签署 | 是 | 是 | 否 | 是 | 是 |
| 实验状态机（多态流转） | 是 | 是 | 基础 | 部分 | 是 |
| 化学结构编辑（Ketcher等） | 是（顶级） | 是 | 否 | 否 | 否 |
| 表格+公式 | 是 | 是 | 是（基础） | 是（基础） | 是 |
| @提及（人/仪器/样品） | 是 | 是 | 否 | 否 | 否 |
| 实验模板库 | 是 | 是 | 是 | 是 | 是 |
| 实验标签/分类 | 是 | 是 | 是 | 是 | 是 |
| 附件上传（图片/文件） | 是 | 是 | 是 | 是 | 是 |
| 图片标注 | 是 | 否 | 否 | 否 | 否 |
| 代码块（Python/R） | 否 | 是（Jupyter集成） | 否 | 否 | 否 |
| 全文搜索 | 是（AI语义） | 是 | 是 | 是 | 是 |

#### 维度 5：Protocol 管理

| 功能点 | Benchling | SciNote | eLabFTW | LabArchives | STARLIMS |
|--------|-----------|---------|---------|-------------|---------|
| 协议模板库 | 是（共享） | 是（个人+团队双库） | 是 | 是 | 是 |
| 版本控制（changelog） | 是 | 是 | 是 | 是 | 是 |
| 步骤执行记录（逐步打卡） | 是（Workflows） | 是 | 否 | 否 | 是 |
| 偏差记录 | 是 | 是 | 否 | 否 | 是 |
| PDF 导入/AI 解析 | 否 | **是（AI导入）** | 否 | 否 | 否 |
| 任务-协议关联执行 | 是 | 是 | 否 | 否 | 是 |
| 协议版本更新通知 | 是 | 是 | 否 | 否 | 是 |
| 协议与库存试剂关联 | 是 | 是 | 否 | 否 | 是 |
| 公开协议市场 | 是（社区） | 是（协议库） | 是（可导入） | 否 | 否 |

#### 维度 6：库存管理

| 功能点 | Benchling | SciNote | eLabFTW | LabArchives | STARLIMS |
|--------|-----------|---------|---------|-------------|---------|
| 库存条目管理 | 是（Registry） | 是 | 是（Database） | 否 | 是 |
| 条形码/二维码扫描 | 是 | 是 | 是 | 否 | 是 |
| 自定义列（类型：文本/数字/日期/下拉/文件） | 是（高度灵活） | **是（最佳实践）** | 是（自定义字段） | 否 | 是 |
| 低库存预警 | 是 | 是 | 否 | 否 | 是 |
| 出入库日志（事务记录） | 是 | 是 | 否 | 否 | 是 |
| 库存与实验关联 | 是 | 是 | 否 | 否 | 是 |
| 供应商管理 | 是 | 是 | 否 | 否 | 是 |
| 批次/效期管理 | 是 | 是 | 否 | 否 | 是 |
| PDF 标签打印 | 是 | 是 | 是 | 否 | 是 |
| AI 库存预测 | 否 | 是（计划中） | 否 | 否 | 否 |
| 跨团队库存共享 | 是 | 是（企业版） | 否 | 否 | 是 |

#### 维度 7：样品管理

| 功能点 | Benchling | SciNote | eLabFTW | LabArchives | STARLIMS |
|--------|-----------|---------|---------|-------------|---------|
| 样品追踪（全生命周期） | 是（顶级） | 是 | 是（基础） | 否 | 是 |
| 链式监管（Chain of Custody） | 是 | 否 | 否 | 否 | 是 |
| 存储定位（冰箱/架子/位置） | 是（Registry） | 是 | 是（存储层级） | 否 | 是 |
| 样品条码 | 是 | 是 | 是 | 否 | 是 |
| 样品与实验关联 | 是 | 是 | 否 | 否 | 是 |
| 样品类型自定义 | 是 | 是 | 是 | 否 | 是 |
| 样品事件日志（转移/分装等） | 是 | 否 | 否 | 否 | 是 |

#### 维度 8：AI 功能

| 功能点 | Benchling | SciNote | eLabFTW | LabArchives | STARLIMS |
|--------|-----------|---------|---------|-------------|---------|
| AI 问答助手（Chat） | **是（Ask Agent）** | 否 | 否 | 否 | 否 |
| 深度研究（跨历史记录语义搜索） | **是（Deep Research）** | 否 | 否 | 否 | 否 |
| RAG 知识库问答 | **是（内置）** | 否 | 否 | 否 | 否 |
| 协议 PDF 自动结构化 | 否 | **是（AI 导入）** | 否 | 否 | 否 |
| 实验报告自动生成 | 是（部分） | 否 | 否 | 否 | 否 |
| 语音转录 | 否 | 否 | 否 | 否 | 否 |
| 库存消耗预测 | 否 | 是（AI优化，计划中） | 否 | 否 | 否 |
| 异常数据检测 | 是（Benchling Insights） | 否 | 否 | 否 | 否 |
| 图像识别（WB/凝胶图） | 否 | 否 | 否 | 否 | 否 |
| 自然语言数据查询 | 是（Explore Data） | 否 | 否 | 否 | 否 |
| 实验设计建议（Compose Agent） | 是（Benchtalk 2025发布） | 否 | 否 | 否 | 否 |

#### 维度 9：数据可视化与报告

| 功能点 | Benchling | SciNote | eLabFTW | LabArchives | STARLIMS |
|--------|-----------|---------|---------|-------------|---------|
| 项目进度仪表盘 | 是 | 是 | 否 | 否 | 是 |
| 库存统计图表 | 是 | 是 | 否 | 否 | 是 |
| 仪器使用率图表 | 是 | 否 | 否 | 否 | 是 |
| 实验数据图表内嵌 | 是 | 是（Recharts内嵌） | 否 | 否 | 是 |
| 自定义仪表盘 | 是（Analytics） | 是 | 否 | 否 | 是 |
| 报告生成（PDF/Word导出） | 是 | 是 | 是（PDF导出） | 是 | 是 |
| 合规报告自动化 | 是 | 是 | 否 | 是 | 是（顶级） |

#### 维度 10：集成能力

| 功能点 | Benchling | SciNote | eLabFTW | LabArchives | STARLIMS |
|--------|-----------|---------|---------|-------------|---------|
| REST API | 是（完整） | 是 | 是 | 是（基础） | 是 |
| Webhook | 是 | 是 | 是 | 否 | 是 |
| 仪器直连（测序仪/质谱等） | 是（顶级，Tecan/HighRes） | 否 | 否 | 否 | 是（双向通信） |
| ERP/LIMS集成 | 是 | 是（企业版） | 否 | 否 | 是（SAP等） |
| 身份管理（LDAP/SAML/OIDC） | 是 | 是 | 是 | 是 | 是 |
| Zapier/n8n 集成 | 否 | 否 | 否 | 否 | 否 |
| 数据导出（CSV/Excel/JSON） | 是 | 是 | 是 | 是 | 是 |
| MCP（模型上下文协议） | **是（2025发布）** | 否 | 否 | 否 | 否 |

#### 维度 11：移动端支持

| 功能点 | Benchling | SciNote | eLabFTW | LabArchives | STARLIMS |
|--------|-----------|---------|---------|-------------|---------|
| 移动端 Web（响应式） | 是 | 是 | 是 | 是 | 是（有限） |
| iOS/Android 原生 App | 否 | **是** | 否 | 否 | 是（企业定制） |
| 条码扫描（移动） | 是（通过App） | 是 | 否 | 否 | 是 |
| 语音输入 | 否 | 否 | 否 | 否 | 否 |
| 离线模式 | 否 | 否 | 否 | 否 | 否 |

#### 维度 12：合规性

| 功能点 | Benchling | SciNote | eLabFTW | LabArchives | STARLIMS |
|--------|-----------|---------|---------|-------------|---------|
| 21 CFR Part 11 | 是 | **是（完整）** | 部分 | 是 | **是（顶级）** |
| GLP/GMP 支持 | 是 | 是 | 否 | 否 | 是 |
| 电子签名（合规级） | 是 | 是 | 是 | 是 | 是 |
| 不可篡改审计追踪 | 是 | 是 | 是 | 是 | 是 |
| SOC 2 Type II | 是 | 是 | 是（自托管） | 是 | 是 |
| ISO 27001 | 是 | 是 | 是（自托管） | 是 | 是 |
| HIPAA | 是（Enterprise） | 是（Enterprise） | 是（自托管） | 是 | 是 |
| FedRAMP | 是 | 进行中 | 否 | 是 | 是 |
| 数据驻留（本地部署） | 否 | 是（自托管） | **是（完全自托管）** | 否 | 是 |

---

## 二、PonyLab V2 已实现功能盘点

基于代码分析（后端模块 + 前端页面 + API Client），以下是 PonyLab V2 的实际实现状态：

### 2.1 后端模块（已实现 API）

**模块列表**（`/apps/api/src/modules/`）：
auth, team, invitation, application, direction, project, task, task-step, experiment, instrument, inventory, protocol, sample, file, comment, notification, announcement, audit

#### 已实现的核心功能

**权限与认证**
- JWT 认证（access + refresh token）
- 用户注册/登录
- 团队角色（OWNER, ADMIN, MEMBER, GUEST）
- 邮件/链接/邀请码三轨邀请机制（完整实现）
- 申请加入流程（含审批）
- 功能角色（INSTRUMENT_ADMIN, INVENTORY_ADMIN, ELN_WITNESS - schema定义，guard层待全面部署）

**团队协作**
- 团队 CRUD（含 visibility: OPEN/CLOSED/PRIVATE）
- 成员管理（添加/移除/角色变更）
- 研究方向（Direction）管理
- 项目管理（含 directionId 关联）

**任务管理**
- 任务 CRUD（含 dueDate/assigneeId/priority/status）
- 任务步骤（TaskStep）CRUD（含 completed 状态）
- 任务位置（posX/posY - 画布坐标）更新接口
- 项目/任务/仪器留言板（Comment，含线程回复、置顶、标签）

**实验记录（ELN）**
- 实验 CRUD（含 TipTap content JSON）
- 实验状态（DRAFT/IN_PROGRESS/COMPLETED/SIGNED/ARCHIVED）
- 数字签名（signedAt + signedBy + lockedAt）
- 已签署记录锁定（禁止编辑/删除）
- 审计追踪（AuditLog，含 CREATE/UPDATE/DELETE/SIGN 动作）
- 实验标签

**仪器管理**
- 仪器 CRUD（含 manufacturer/model/serialNumber/location）
- 预约创建（含冲突检测）
- 预约日历数据（getCalendar，含用户颜色 userColor）
- 可用性检查（checkAvailability）
- 维护记录（MaintenanceRecord）
- 仪器留言板（通过 Comment 模块）

**库存管理**
- 库存条目 CRUD
- 出入库调整（IN/OUT/ADJUST，事务原子操作）
- 低库存查询（Raw SQL，quantity <= minQuantity）
- 库存日志（InventoryLog）
- 审计追踪

**协议管理**
- 协议 CRUD（含版本控制）
- 版本创建（changelog 记录）
- 发布（isPublished）
- 分页查询（按 category 过滤）

**样品管理**
- 样品 CRUD（含 barcode/metadata/storagePosition）
- 样品事件日志（SampleEvent: CREATED/TRANSFERRED/等）
- 存储位置关联（storage）
- 样品状态更新

**通知与公告**
- 站内通知（创建/标记已读/批量已读/未读数）
- 公告（Announcement，scope: INSTRUMENT/INVENTORY/TEAM）

**审计**
- 审计日志（完整过滤：entityType/entityId/userId/action/时间范围）
- BUG-006 已修复（实体级查询条件验证）

### 2.2 前端页面（已实现 UI）

**已有页面**（`/apps/web/src/app/(dashboard)/`）：
- `dashboard/` - 个人仪表盘
- `directions/` - 研究方向列表 + 详情
- `projects/[id]/` - 项目详情（含任务视图）
- `experiments/` - 实验记录列表 + 创建
- `experiments/[id]/` - 实验详情
- `instruments/` - 仪器列表
- `instruments/[id]/` - 仪器详情（含日历Tab）
- `inventory/` - 库存列表
- `protocols/` - 协议列表
- `samples/` - 样品列表
- `tasks/` - 任务视图
- `teams/` - 团队管理
- `settings/` - 个人设置
- `audit/` - 审计日志

---

## 三、综合对比矩阵

图例：✅ 已实现 | 🔶 部分实现（有后端但前端不完整，或功能降级） | ❌ 未实现 | 🌟 PonyLab 独有

### 3.1 项目管理

| 功能 | Benchling | SciNote | eLabFTW | LabArchives | STARLIMS | PonyLab V2 |
|------|:---------:|:-------:|:-------:|:-----------:|:--------:|:----------:|
| 研究方向层级 | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ 🌟 |
| 四层结构（方向→项目→任务→步骤） | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ 🌟 |
| 任务看板视图（Kanban） | ✅ | ✅ | ❌ | ❌ | ✅ | 🔶（后端有，前端基础） |
| DAG/画布视图（依赖连线） | ✅ | ✅ | ❌ | ❌ | ✅ | ❌（posX/posY有，箭头连线无） |
| 甘特图 | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 任务步骤（TaskStep） | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| 任务里程碑 | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| 任务参与者多人 | ✅ | ✅ | ❌ | ❌ | ✅ | 🔶（assignee有，多参与者无） |
| 项目进度百分比 | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| 任务依赖关系（dependencies） | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| 留言板（项目/任务级） | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ 🌟（支持线程+标签+置顶） |

### 3.2 权限与团队协作

| 功能 | Benchling | SciNote | eLabFTW | LabArchives | STARLIMS | PonyLab V2 |
|------|:---------:|:-------:|:-------:|:-----------:|:--------:|:----------:|
| 系统角色（ADMIN/USER） | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 团队角色（OWNER/ADMIN/MEMBER/GUEST） | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 功能角色（仪器管理员/仓库管理员/ELN见证人） | ❌ | 部分 | ❌ | ❌ | ✅ | 🔶（schema有，guard未全部署） |
| 团队可见性（OPEN/CLOSED/PRIVATE） | ✅ | ✅ | ✅ | 部分 | ✅ | ✅ 🌟（三模式完整实现） |
| 三轨邀请（邮件+链接+邀请码） | ✅ | 部分 | 部分 | 部分 | ✅ | ✅ 🌟（最完整） |
| 申请加入审批流程 | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ 🌟 |
| SSO/SAML | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| 多租户隔离 | ✅ | ✅ | ✅ | ✅ | ✅ | 🔶（团队隔离有，多租户不完整） |
| 细粒度权限守卫 | ✅ | ✅ | ✅ | 部分 | ✅ | ❌（BUG-005未修复，RBAC守卫不完整） |

### 3.3 仪器管理

| 功能 | Benchling | SciNote | eLabFTW | LabArchives | STARLIMS | PonyLab V2 |
|------|:---------:|:-------:|:-------:|:-----------:|:--------:|:----------:|
| 仪器注册/CRUD | ✅ | ❌ | ✅ | ❌ | ✅ | ✅ |
| 预约日历（周/日/月视图） | ❌ | ❌ | ✅（基础） | ❌ | 部分 | 🔶（后端完整，前端日历组件待实现） |
| 资源视图（纵轴多仪器） | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ 🌟（PRD设计，未实现） |
| 实时冲突检测 | ❌ | ❌ | ✅（基础） | ❌ | 部分 | ✅（后端完整） |
| 用户颜色标识 | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ 🌟（userColor字段实现） |
| 预约审批流程 | ❌ | ❌ | ❌ | ❌ | 部分 | ❌（PRD有设计，未实现） |
| 预约提醒（30分钟前） | ❌ | ❌ | ❌ | ❌ | 部分 | ❌ |
| 维护记录 | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| 仪器留言板（线程式） | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ 🌟 |
| 仪器公告 | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ 🌟 |
| 使用统计 | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |

### 3.4 ELN 功能

| 功能 | Benchling | SciNote | eLabFTW | LabArchives | STARLIMS | PonyLab V2 |
|------|:---------:|:-------:|:-------:|:-----------:|:--------:|:----------:|
| 富文本编辑器（TipTap） | ✅ | ✅ | ✅ | ✅ | ✅ | 🔶（TipTap集成，扩展不完整） |
| 版本历史记录 | ✅ | ✅ | ✅ | ✅ | ✅ | ❌（无实验版本快照） |
| 数字签名 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅（已实现 sign endpoint） |
| 见证人签署 | ✅ | ✅ | ❌ | ✅ | ✅ | ❌（ELN_WITNESS角色设计，接口未实现） |
| 签署后锁定 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 完整状态机（7态） | ✅ | ✅ | 部分 | 部分 | ✅ | 🔶（5态，缺 SUBMITTED/WITNESSED） |
| 化学结构编辑 | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| 实验模板 | ✅ | ✅ | ✅ | ✅ | ✅ | ❌（schema设计，功能未实现） |
| @提及功能 | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| 图片标注 | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 代码块（Python/R） | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| 不可篡改审计追踪 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### 3.5 Protocol 管理

| 功能 | Benchling | SciNote | eLabFTW | LabArchives | STARLIMS | PonyLab V2 |
|------|:---------:|:-------:|:-------:|:-----------:|:--------:|:----------:|
| 协议 CRUD | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 版本控制（changelog） | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 发布/未发布状态 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 个人+团队双库 | ✅ | ✅ | ✅ | 部分 | ✅ | ❌（无双库分层） |
| 步骤执行记录（逐步打卡） | ✅ | ✅ | ❌ | ❌ | ✅ | ❌（PRD设计 ProtocolExecution，未实现） |
| 偏差记录 | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| PDF 导入+AI 解析 | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| 协议版本更新通知 | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| 任务-协议关联执行 | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |

### 3.6 库存管理

| 功能 | Benchling | SciNote | eLabFTW | LabArchives | STARLIMS | PonyLab V2 |
|------|:---------:|:-------:|:-------:|:-----------:|:--------:|:----------:|
| 库存条目 CRUD | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| 出入库事务日志 | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| 低库存预警 | ✅ | ✅ | ❌ | ❌ | ✅ | 🔶（查询接口有，通知触发待实现） |
| 条形码/二维码 | ✅ | ✅ | ✅ | ❌ | ✅ | 🔶（barcode字段有，扫描组件无） |
| 自定义列类型 | ✅ | ✅ | ✅ | ❌ | ✅ | ❌（PRD设计 InventoryColumn，未实现） |
| 供应商/货号管理 | ✅ | ✅ | ❌ | ❌ | ✅ | 🔶（supplier/catalogNumber字段有，管理UI无） |
| 批次/效期管理 | ✅ | ✅ | ❌ | ❌ | ✅ | 🔶（expiryDate字段有，批次追踪无） |
| PDF 标签打印 | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| 库存与任务自动扣减 | ✅ | ✅ | ❌ | ❌ | ✅ | ❌（PRD设计 TaskInventoryUsage，未实现） |
| 库存公告 | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ 🌟 |

### 3.7 样品管理

| 功能 | Benchling | SciNote | eLabFTW | LabArchives | STARLIMS | PonyLab V2 |
|------|:---------:|:-------:|:-------:|:-----------:|:--------:|:----------:|
| 样品 CRUD | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| 样品事件日志（链式监管） | ✅ | ❌ | ❌ | ❌ | ✅ | ✅（SampleEvent 已实现） |
| 存储位置定位 | ✅ | ✅ | ✅ | ❌ | ✅ | 🔶（storagePosition 字段有，层级 UI 无） |
| 样品条码 | ✅ | ✅ | ✅ | ❌ | ✅ | 🔶（barcode字段有，扫描无） |
| 样品类型自定义 | ✅ | ✅ | ✅ | ❌ | ✅ | 🔶（sampleType 字符串，无枚举管理） |
| QR 码生成 | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |

### 3.8 AI 功能

| 功能 | Benchling | SciNote | eLabFTW | LabArchives | STARLIMS | PonyLab V2 |
|------|:---------:|:-------:|:-------:|:-----------:|:--------:|:----------:|
| AI 对话助手（Chat） | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| RAG 知识库问答 | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 协议 PDF AI 解析 | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| 实验报告自动生成 | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 语音转录 | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 自然语言数据查询 | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 实验设计建议 | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 库存消耗预测 | ❌ | 计划 | ❌ | ❌ | ❌ | ❌ |
| 图像识别（凝胶/WB） | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

### 3.9 数据可视化

| 功能 | Benchling | SciNote | eLabFTW | LabArchives | STARLIMS | PonyLab V2 |
|------|:---------:|:-------:|:-------:|:-----------:|:--------:|:----------:|
| 个人仪表盘 | ✅ | ✅ | ❌ | ❌ | ✅ | 🔶（页面有，数据聚合不完整） |
| 库存预警区块 | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| 今日预约区块 | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 团队动态流 | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| 图表内嵌编辑器 | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| PDF/Word 报告导出 | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |

### 3.10 集成与合规

| 功能 | Benchling | SciNote | eLabFTW | LabArchives | STARLIMS | PonyLab V2 |
|------|:---------:|:-------:|:-------:|:-----------:|:--------:|:----------:|
| REST API | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Webhook | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| SSO（SAML/OIDC） | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| 移动端 App | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ |
| 响应式 Web | ✅ | ✅ | ✅ | ✅ | 部分 | 🔶（基础响应式） |
| 21 CFR Part 11 | ✅ | ✅ | 部分 | ✅ | ✅ | 🔶（签名+审计有，见证人/完整流程缺） |
| 不可篡改审计日志 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 数据导出 | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |

---

## 四、Top 20 功能差距列表

按**用户价值 × 实现难度**综合评分排序（高价值 + 低难度优先）：

### 优先级评分说明

- **用户价值 (V)**：1-5 分（5=核心痛点/差异化竞争力）
- **实现难度 (D)**：1-5 分（1=简单，5=复杂）
- **优先级分数 = V × (6 - D)**：分数越高优先级越高

---

| 排名 | 功能 | 竞品有 | 用户价值 | 实现难度 | 优先级分数 | 说明 |
|------|------|--------|----------|----------|-----------|------|
| **#1** | **完整 RBAC 权限守卫部署** | 全部竞品 | 5 | 2 | 20 | BUG-005 核心安全漏洞，Researcher 可删任意项目；PermissionGuard 逻辑已有，需全面部署到所有端点 |
| **#2** | **仪器预约日历 UI（React Big Calendar）** | eLabFTW/Labguru | 5 | 2 | 20 | 后端 getCalendar + checkAvailability 完整；前端仅有列表，缺 Calendar 组件；PonyLab 核心差异化功能 |
| **#3** | **ELN 富文本编辑器完整化（TipTap 扩展）** | 全部竞品 | 5 | 2 | 20 | TipTap 已集成，需添加：表格+公式、图片上传、@提及、清单组件；是 ELN 核心体验 |
| **#4** | **实验版本历史记录** | 全部竞品 | 4 | 2 | 16 | 当前无版本快照；需在 update 时存储 ExperimentSnapshot；竞品标配，合规必需 |
| **#5** | **任务看板视图（Kanban）** | Benchling/SciNote | 4 | 2 | 16 | 后端 task status 完整；前端需实现三列拖拽看板（dnd-kit）；研究生日常高频操作 |
| **#6** | **低库存预警通知触发** | 全部主要竞品 | 4 | 2 | 16 | getLowStockItems SQL 接口已有；需在 adjustQuantity 后检查并触发 NotificationService；技术门槛低 |
| **#7** | **个人 Dashboard 数据聚合完整化** | Benchling/SciNote | 4 | 2 | 16 | 页面存在但数据稀疏；需集成：待办任务、今日预约、低库存预警、团队动态四象限 |
| **#8** | **实验模板库** | 全部竞品 | 4 | 2 | 16 | schema 有 ExperimentTemplate；需实现创建/选用/团队共享流程；减少重复劳动 |
| **#9** | **协议步骤执行记录（逐步打卡）** | Benchling/SciNote/STARLIMS | 5 | 3 | 15 | PRD 有 ProtocolExecution/ProtocolExecutionStep 完整 schema；实验可重复性核心；eLabFTW 无此功能是弱点 |
| **#10** | **项目 DAG 画布视图（React Flow）** | Benchling/SciNote | 5 | 3 | 15 | posX/posY 字段已存在；需实现 React Flow 拖拽+箭头连线；是 PonyLab 相比 eLabFTW 的核心差异化 |
| **#11** | **见证人签署流程** | Benchling/SciNote/LabArchives | 4 | 3 | 12 | ELN_WITNESS 角色已设计；需实现 witness endpoint + 状态流转（SIGNED→WITNESSED）；21 CFR Part 11 合规要求 |
| **#12** | **实验状态完整化（SUBMITTED/WITNESSED）** | Benchling/SciNote | 4 | 3 | 12 | 当前 5 态缺 SUBMITTED/WITNESSED/REJECTED；是见证人签署的前提 |
| **#13** | **库存自定义列（InventoryColumn）** | Benchling/SciNote/eLabFTW | 3 | 3 | 9 | PRD 有完整 schema 设计；SciNote 以此为库存核心竞争力；支持不同类型物料的个性化字段 |
| **#14** | **协议 PDF 导入（AI 解析）** | SciNote | 4 | 4 | 8 | 只有 SciNote 有；PonyLab 实现可形成差异化；需 Unstructured.io + Claude API；对实验室迁移至关重要 |
| **#15** | **QR 码生成（库存+样品）** | 全部主要竞品 | 3 | 3 | 9 | barcode 字段已有；需集成 qrcode 库生成 PNG；PDF 标签打印；条码扫描组件（摄像头） |
| **#16** | **AI 实验助手（Chat，Claude API）** | Benchling | 5 | 4 | 10 | 无竞品（除 Benchling）；PonyLab 的 AI 原生定位核心；需 context assembly + Claude API；高 ROI |
| **#17** | **数据导出（CSV/PDF）** | 全部竞品 | 3 | 2 | 12 | 当前无导出功能；实验/库存/样品数据导出是基础功能；papaparse + jspdf 即可实现 |
| **#18** | **仪器使用统计看板** | Benchling/STARLIMS | 3 | 3 | 9 | 后端 booking 数据完整；需聚合使用率/热门时段/用户排名；仪器管理员核心需求 |
| **#19** | **预约前提醒通知（Cron Job）** | Benchling | 3 | 2 | 12 | Notification 模块完整；需 @nestjs/schedule 定时扫描即将到来的 booking；UX 细节但高频感知 |
| **#20** | **SSO/SAML 支持** | 全部竞品 | 3 | 4 | 6 | 企业客户必需；NextAuth.js + passport-saml 可实现；短期可用邮箱登录替代 |

---

## 五、战略分析

### 5.1 PonyLab 独有功能（竞争壁垒）

以下功能竞品**均未实现**，是 PonyLab 的差异化优势，需重点保持和强化：

| 功能 | 竞争价值 |
|------|---------|
| 研究方向层级（Direction → Project → Task → Step 四层结构） | 无竞品有完整四层，LabManager 是唯一参考对象 |
| 仪器留言板（线程式，含标签/置顶） | Benchling/SciNote/eLabFTW 均无；用于仪器故障沟通和使用心得分享 |
| 仪器公告（INSTRUMENT scope） | 无竞品有；维护通知/停机预告的标准渠道 |
| 库存公告（INVENTORY scope） | 无竞品有；新试剂到货/召回通知 |
| 三轨邀请（邮件+链接+邀请码全实现） | SciNote/eLabFTW 仅部分实现；PonyLab 最完整 |
| 申请加入审批流程（OPEN/CLOSED 团队） | 竞品均无；解决新成员自助加入问题 |
| 用户预约颜色标识（userColor 字段） | 无竞品实现此设计；大幅提升日历视图可读性 |

### 5.2 最大功能缺口（高优先级修复）

**安全类（必须立即修复）**：
- RBAC 权限守卫不完整（BUG-005）：Researcher 可删任意项目，这是严重安全漏洞

**核心体验类（1个月内）**：
- 仪器日历 UI（PonyLab 最核心差异化，后端已就绪）
- ELN 编辑器完整化（TipTap 扩展）
- 任务看板视图

**合规类（2个月内）**：
- 实验版本历史
- 完整签署状态机 + 见证人流程
- 数据导出

**AI 类（3个月内，建立长期壁垒）**：
- AI 实验助手（Chat）
- 协议 PDF AI 解析

### 5.3 功能覆盖率评估

| 维度 | 已完整实现 | 部分实现 | 未实现 | 覆盖率 |
|------|-----------|---------|--------|--------|
| 项目管理 | 3/11 | 2/11 | 6/11 | 45% |
| 权限协作 | 4/9 | 2/9 | 3/9 | 56% |
| 仪器管理 | 3/11 | 3/11 | 5/11 | 41% |
| ELN 功能 | 5/14 | 2/14 | 7/14 | 43% |
| Protocol 管理 | 3/9 | 0/9 | 6/9 | 33% |
| 库存管理 | 2/11 | 4/11 | 5/11 | 45% |
| 样品管理 | 2/7 | 3/7 | 2/7 | 50% |
| AI 功能 | 0/9 | 0/9 | 9/9 | 0% |
| 数据可视化 | 0/6 | 1/6 | 5/6 | 8% |
| 集成合规 | 2/8 | 2/8 | 4/8 | 38% |
| **综合** | **24/95** | **19/95** | **52/95** | **45%** |

> 结论：PonyLab V2 后端 API 覆盖率较高（约 65%），但前端 UI 实现率较低（约 30%），大量功能停留在"有接口无界面"或"有字段无逻辑"阶段。

---

## 六、参考资料

- [Benchling Platform Features](https://www.benchling.com/platform)
- [Benchling AI 功能（2025 Benchtalk）](https://www.benchling.com/blog/heres-everything-we-released-at-benchtalk-2025)
- [Benchling Ask Agent](https://help.benchling.com/hc/en-us/articles/39455311469709-Explore-data-with-the-Ask-agent)
- [Benchling Deep Research](https://help.benchling.com/hc/en-us/articles/38679507502733-Deep-Research)
- [SciNote ELN Product Overview](https://www.scinote.net/product/)
- [SciNote AI for Lab Data Management](https://www.scinote.net/blog/scinote-prepares-your-lab-for-impactful-ai/)
- [eLabFTW User Guide](https://doc.elabftw.net/user-guide.html)
- [eLabFTW GitHub](https://github.com/elabftw/elabftw)
- [LabArchives ELN Features](https://www.labarchives.com/products/eln-for-research)
- [STARLIMS Enterprise LIMS](https://www.starlims.com/)
- [LIMS Comparison Guide 2025 - IntuitionLabs](https://intuitionlabs.ai/articles/lims-system-guide-2025)
- [Best ELN Software 2025 - Sapio Sciences](https://www.sapiosciences.com/blog/best-electronic-lab-notebook/)

---

*报告生成时间：2026-03-05 | 分析基于 PonyLab V2 PRD 及实际代码（后端模块 + 前端页面 + API Client）*
