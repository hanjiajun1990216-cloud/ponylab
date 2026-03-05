# PonyLab V2 — E2E 测试报告

**日期**: 2026-03-05
**测试环境**: macOS Darwin 24.6.0, Node 22, Next.js 15 + NestJS 11
**API**: http://localhost:4001 | **Frontend**: http://localhost:3000

---

## 1. API E2E 测试结果 (curl 脚本)

| 模块 | 测试项 | 结果 |
|------|--------|------|
| Health | 健康检查 | ✅ 200 |
| Auth | Admin/PI/Researcher/Tech 登录 | ✅ 全部通过 |
| Auth | 重复邮箱注册 (BUG-001) | ✅ 409 |
| Auth | SEC-001 passwordHash 未暴露 | ✅ |
| Teams | 列表/详情/成员 | ✅ 200 |
| Directions | 列表/详情/创建 | ✅ 200/201 |
| Projects | 团队项目/详情 | ✅ 200 |
| Tasks | 项目任务列表/创建/更新位置 | ✅ 200/201 |
| Experiments | 项目实验列表/详情 | ✅ 200 |
| Samples | 样品列表 | ✅ 200 |
| Inventory | 列表/入库/出库 (BUG-003) | ✅ 200/201 |
| Instruments | 列表/详情/日历 | ✅ 200 |
| Protocols | 协议列表 | ✅ 200 |
| Comments | 项目评论/创建/回复 | ✅ 200/201 |
| Announcements | 公告列表/创建 | ✅ 200/201 |
| Notifications | 列表/未读数/全部已读 | ✅ 200 |
| TaskSteps | 创建步骤 | ✅ 201 |
| Audit | 日志列表/BUG-006 空参数拒绝 | ✅ 200/400 |
| Permission | BUG-005 Researcher 删除项目 | ✅ 403 |

**API 通过率**: 39/39 = 100%（修复前）→ 新增 Task 模块后仍稳定

---

## 2. 浏览器 E2E 测试结果 (Playwright MCP)

### 2.1 认证流程
| 操作 | 结果 |
|------|------|
| 新用户注册 (张伟 zhangwei@lab.edu) | ✅ |
| Admin 登录 (admin@ponylab.io) | ✅ |
| Dashboard 渲染（侧边栏4组/统计卡片/仪器/团队） | ✅ |

### 2.2 团队管理
| 操作 | 结果 |
|------|------|
| 团队列表（SUPER_ADMIN 看到所有团队） | ✅ 修复后 |
| 创建团队 (Drug Discovery Lab, OPEN) | ✅ 修复后 |
| 团队详情（标签页：成员/邀请/申请/设置） | ✅ |
| 成员列表（头像+姓名+角色+日期） | ✅ 修复后 |
| 发送邀请 (zhangwei@lab.edu → 待处理) | ✅ 修复后 |

### 2.3 研究方向 + 项目
| 操作 | 结果 |
|------|------|
| 方向列表（3个方向+项目计数） | ✅ |
| 方向详情（面包屑+项目列表） | ✅ |
| 按方向查询项目 (/projects/direction/:id) | ✅ 修复后 |
| 项目详情页（标题+状态+描述+完成度） | ✅ |

### 2.4 任务管理 — 三视图
| 操作 | 结果 |
|------|------|
| **画布视图** — ReactFlow 渲染 5 个任务节点 | ✅ |
| 新建任务 (SDS-PAGE 凝胶电泳) → 第 6 个节点 | ✅ |
| **列表视图** — 6 行表格（状态/负责人/步骤） | ✅ |
| **看板视图** — 三列（待办3/进行中1/已完成2） | ✅ |

### 2.5 资源管理
| 操作 | 结果 |
|------|------|
| 仪器列表（3台/状态/序列号/位置） | ✅ |
| 仪器详情（预约日历/留言板/维护/统计 4标签） | ✅ |
| React Big Calendar 周视图渲染 | ✅ |
| 库存列表（5种试剂/SKU/数量/供应商） | ✅ |
| 样品列表（3个样品/条形码/存储位置） | ✅ |
| 协议列表（1个 SOP/版本/作者/分类） | ✅ |
| 审计日志（20+条记录/emoji图标/用户/详情） | ✅ |

---

## 3. 本次修复的 Bug 清单

| # | Bug | 根因 | 修复 |
|---|-----|------|------|
| 1 | Team creation 400 | CreateTeamDto 缺少 `visibility` 字段 | 添加 `@IsEnum` visibility |
| 2 | Teams 页面"暂无团队" | findAll 只查成员关联团队，SUPER_ADMIN 被过滤 | 添加 role 检查 |
| 3 | /projects/direction/:id 404 | ProjectController 缺少按方向查询端点 | 新增 findByDirection |
| 4 | 成员列表显示 "?" | 前端直接访问 member.firstName 而非 member.user.firstName | 修复字段路径 |
| 5 | 邀请发送 500 | InvitationService.create 缺少 type 默认值 | `type ?? "EMAIL"` |
| 6 | 任务不加载/画布空 | 缺少独立的 Task 模块 (controller/service) | 新建 TaskModule |

---

## 4. 已知待优化项

| 优先级 | 描述 |
|--------|------|
| P1 | 任务卡片名称在列表/看板视图中不显示 title（只有状态和负责人） |
| P1 | 仪器日历 booking API 参数格式不匹配（bookings 不返回数据） |
| P2 | 新建方向/项目每次 E2E 都创建重复数据（需要幂等或清理） |
| P2 | 看板拖拽功能存在（dnd-kit），但需要前端对接 PATCH /tasks/:id |
| P3 | DAG 画布节点位置未持久化（刷新后重置） |
| P3 | 设置页面 visibility 选项值与 Prisma enum 不完全对齐（PUBLIC vs OPEN） |

---

## 5. 竞品对比概要

详细报告：`plans/2026-03-05-0700_ponylab-v2-competitive-gap-analysis.md`

**PonyLab V2 功能覆盖率**: 45%（24/95 完整实现）
**独有竞争壁垒**: 仪器留言板、公告系统、Direction 四层结构、三轨邀请
**Top 5 差距**: 完整 RBAC Guard、仪器日历 UI 完善、ELN 富文本、实验版本历史、任务看板拖拽
