# PonyLab V3 — 竞品差距补齐 Sprint 1

**日期**: 2026-03-05
**基于**: plans/2026-03-05-0700_ponylab-v2-competitive-gap-analysis.md
**分支**: feat/v3-competitive-gap-sprint1

---

## 目标

将功能覆盖率从 45% → 60%+，修复 #1 安全漏洞，补齐 Top 7 高优先级差距。

## 实际差距评估（代码审查后修正）

| #   | 功能           | 竞品报告评估 | 实际状态                                             | 本次需做                                |
| --- | -------------- | ------------ | ---------------------------------------------------- | --------------------------------------- |
| 1   | RBAC 权限守卫  | ❌           | PermissionGuard 逻辑已有，16/18 个 controller 未部署 | 全面部署                                |
| 2   | 仪器日历 UI    | 🔶           | ✅ React Big Calendar 已实现                         | 修复 booking 字段不匹配 (purpose→title) |
| 4   | 实验版本历史   | ❌           | 无 ExperimentSnapshot model                          | 新建 schema + migration + service       |
| 5   | 任务看板拖拽   | 🔶           | ✅ dnd-kit 已实现                                    | 修复 task title 显示问题                |
| 6   | 低库存预警通知 | 🔶           | adjustQuantity 无通知触发                            | 在 transaction 后添加通知               |
| 7   | Dashboard 聚合 | 🔶           | 4象限已有但 low-stock 用错 API                       | 改用 /inventory/low-stock 端点          |
| 10  | DAG 画布视图   | ❌           | ✅ ReactFlow 边已有                                  | 无需改动（已通过E2E）                   |
| 17  | 数据导出 CSV   | ❌           | 无导出功能                                           | 后端添加 CSV 导出端点                   |

## 实施计划

### Batch 1 — 后端（并行）

**1.1 RBAC Guard 全面部署**

- 16个 controller 添加 @UseGuards(PermissionGuard) 和 @RequirePermission()
- 写操作（POST/PATCH/DELETE）需要权限检查
- 读操作保持 JWT 即可（authenticated = readable）
- HealthController 保持公开

**1.2 低库存预警通知**

- inventory.service.ts adjustQuantity 方法末尾
- 检查 quantityAfter <= minQuantity
- 调用 NotificationService.create 发送通知
- 需要 InventoryModule 导入 NotificationModule

**1.3 实验版本历史**

- 新 Prisma model: ExperimentSnapshot { id, experimentId, version, title, content, userId, createdAt }
- experiment.service.ts update 方法中，更新前创建快照
- 新 API: GET /experiments/:id/history
- 前端: 实验详情页添加"历史版本"标签

**1.4 数据导出 (CSV)**

- 新模块: ExportModule
- GET /export/experiments?format=csv
- GET /export/inventory?format=csv
- GET /export/samples?format=csv
- 使用 json2csv 库

### Batch 2 — 前端修复（并行）

**2.1 仪器日历字段修复**

- instruments/[id]/page.tsx: booking 提交 `title` 而非 `purpose`

**2.2 Dashboard 低库存 API 修正**

- dashboard/page.tsx: 改用 api.getLowStockItems() 代替客户端过滤

**2.3 Task title 显示修复**

- 检查 kanban card 中 title 字段是否正确渲染

## 预期覆盖率变化

| 维度       | 当前    | 本次后                     |
| ---------- | ------- | -------------------------- |
| 权限协作   | 56%     | 78%（RBAC 全面部署）       |
| ELN 功能   | 43%     | 57%（版本历史）            |
| 库存管理   | 45%     | 55%（预警通知+导出）       |
| 数据可视化 | 8%      | 25%（Dashboard 完善+导出） |
| **综合**   | **45%** | **~58%**                   |
