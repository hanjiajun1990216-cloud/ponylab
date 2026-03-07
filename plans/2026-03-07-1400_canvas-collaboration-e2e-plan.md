# PonyLab 实施方案：画布修复 + 团队协作 + E2E 测试扩展

**日期**: 2026-03-07
**状态**: 待审批
**基于**: SciNote/Benchling/eLabFTW 竞品调研 + PonyLab 现有代码分析

---

## 一、调研结论摘要

### 1.1 任务画布（Canvas/DAG）

**竞品做法**：
- **SciNote**：Experiment Canvas 支持自由放置任务卡片 + 工作流连线（代表执行顺序），通过"Edit workflow"按钮进入编辑态
- **Benchling**：Automation Designer 提供 DAG 可视化，节点代表步骤模板，边代表数据流
- **通用工具**：Asana Workflow Builder（节点+箭头流程图）、ClickUp Whiteboard（自由画布）

**技术选型结论**：
- **React Flow (@xyflow/react v12)** 是最佳选择 — MIT 许可、35.5k Stars、原生支持自由放置+连线+自定义 React 节点
- **elkjs** 提供自动布局算法（比 dagre 更强大）
- **@dnd-kit** 仅用于看板场景，不与 React Flow 混用（已知坐标系冲突）

### 1.2 团队协作

**竞品做法**：
- **SciNote**：Organization → Teams → Projects 三层；注册自动创建个人 Team；数据归属团队不随人走；团队不可删除（GxP 合规）
- **Benchling**：权限累加（多 Team 取 union）；Folder 权限只能更严不能更宽
- **eLabFTW**：行级隔离（team_id）；记录级权限（canread/canwrite）

**数据隔离结论**：
- PonyLab 当前已用行级隔离（teamId），方向正确
- 建议增加 PostgreSQL RLS 作为最后防线

### 1.3 E2E 测试策略

**最佳实践**：
- Playwright `storageState` 缓存各角色认证态，避免重复登录
- Worker 级 Fixture 隔离，每个 test 独立 browser context
- 隔离测试走 API 断言（不只依赖 UI 可见性）

---

## 二、当前代码问题诊断

### 2.1 画布视图 Bug（4 个）

| # | Bug | 根因 | 影响 |
|---|-----|------|------|
| 1 | 节点位置无法恢复 | 前端读 `task.positionX/positionY`，API 返回 `posX/posY` | 每次刷新节点重置到网格布局 |
| 2 | 依赖连线画不出来 | 前端用 `dep.id` 作 source，API 返回 `{ upstreamTaskId }` | 箭头永远不显示 |
| 3 | 无法在画布中创建连线 | TaskNode 没有 ReactFlow Handle 组件 | 用户无法通过拖拽建立依赖 |
| 4 | 无编辑/查看模式切换 | 始终可拖拽但无明确的编辑态 | 无意拖拽会改变位置 |

### 2.2 看板视图 Bug（2 个）

| # | Bug | 根因 | 影响 |
|---|-----|------|------|
| 5 | 不支持跨列拖拽 | 三列各有独立 DndContext | 无法拖拽改变任务状态 |
| 6 | 列内拖拽触发无效 API | handleDragEnd 不判断 over | 每次列内松手都调用状态更新 |

---

## 三、实施方案

### Phase 1：修复画布 Bug + 添加连线功能（优先级最高）

#### 1A. 修复字段名不一致（Bug #1）

**文件**: `apps/web/src/app/(dashboard)/projects/[id]/page.tsx`

```typescript
// 修复前
position: task.positionX != null
  ? { x: task.positionX, y: task.positionY }
// 修复后
position: task.posX != null
  ? { x: task.posX, y: task.posY }
```

#### 1B. 修复依赖边构建（Bug #2）

**文件**: 同上 + `apps/api/src/modules/task/task.service.ts`

前端边构建：
```typescript
// 修复前
task.dependencies?.forEach((dep: any) => {
  edges.push({ source: dep.id, target: task.id, ... });
});
// 修复后 — 使用 dependsOn 返回的 upstreamTaskId
task.dependsOn?.forEach((dep: any) => {
  edges.push({ source: dep.upstreamTaskId, target: task.id, ... });
});
```

API service 增加完整返回：
```typescript
dependsOn: {
  select: { id: true, upstreamTaskId: true }
},
```

#### 1C. 添加 ReactFlow Handle（Bug #3）— 实现画布连线

在 TaskNode 组件中添加 source 和 target Handle：
```typescript
import { Handle, Position } from '@xyflow/react';

// TaskNode 组件内
<Handle type="target" position={Position.Top} />
{/* 卡片内容 */}
<Handle type="source" position={Position.Bottom} />
```

添加 `onConnect` 回调，调用 `POST /tasks/:id/dependencies` 创建依赖关系。

#### 1D. 添加编辑/查看模式（Bug #4）

```typescript
const [editMode, setEditMode] = useState(false);

<ReactFlow
  nodesDraggable={editMode}
  nodesConnectable={editMode}
  elementsSelectable={editMode}
  // ...
>
```

画布上方添加"编辑工作流" / "完成编辑"按钮。

### Phase 2：修复看板跨列拖拽

#### 2A. 共享 DndContext（Bug #5, #6）

将三列包裹在一个共享 DndContext 中，每列作为 Droppable：

```typescript
<DndContext onDragEnd={handleDragEnd} onDragOver={handleDragOver}>
  <div className="flex gap-4">
    {statuses.map(status => (
      <KanbanColumn key={status} status={status} tasks={tasksByStatus[status]} />
    ))}
  </div>
  <DragOverlay>{activeTask && <KanbanCard task={activeTask} />}</DragOverlay>
</DndContext>
```

`handleDragEnd` 检查 `over` 确定目标列：
```typescript
const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;
  if (!over) return;
  const newStatus = over.id as string; // column ID = status
  if (active.data.current?.status !== newStatus) {
    onStatusChange(active.id as string, newStatus);
  }
};
```

### Phase 3：E2E 测试大幅扩展

#### 3.1 测试架构改造

```
tests/e2e/
  helpers.ts              # 现有登录 helpers
  fixtures.ts             # 新增：多角色 Fixture
  auth.setup.ts           # 新增：预登录各角色，缓存 storageState
  playwright.config.ts    # 更新：添加 setup project + storageState

  # 现有测试（保留）
  dashboard.spec.ts
  samples-actions.spec.ts
  ...

  # 新增测试
  canvas/
    canvas-drag.spec.ts         # 画布拖拽位置保存
    canvas-connect.spec.ts      # 画布连线创建/删除
    canvas-edit-mode.spec.ts    # 编辑/查看模式切换
  kanban/
    kanban-cross-column.spec.ts # 看板跨列拖拽
  roles/
    admin-permissions.spec.ts   # Admin 完整权限验证
    member-permissions.spec.ts  # Member 受限权限验证
    guest-permissions.spec.ts   # Guest 只读验证
    tech-permissions.spec.ts    # Tech 受限验证
  collaboration/
    invite-accept.spec.ts       # A邀请B，B接受，验证可见性
    invite-reject.spec.ts       # 邀请拒绝
    team-apply.spec.ts          # 申请加入团队+审批
    member-remove.spec.ts       # 移除成员后权限验证
    role-change.spec.ts         # 角色变更后权限变化
  isolation/
    team-data-isolation.spec.ts # TeamA 数据不出现在 TeamB
    cross-team-resource.spec.ts # 跨团队资源不可访问
  team-crud/
    create-team.spec.ts         # 创建团队
    update-team.spec.ts         # 修改团队设置
    team-visibility.spec.ts     # OPEN/CLOSED/PRIVATE 可见性
    delete-team.spec.ts         # 删除团队（如果支持）
  lifecycle/
    sample-full-lifecycle.spec.ts  # 样品完整生命周期
    experiment-workflow.spec.ts    # 实验从创建到签署
    inventory-alert.spec.ts       # 库存预警触发
```

#### 3.2 Fixture 设计

```typescript
// fixtures.ts
import { test as base, Page } from '@playwright/test';

type MultiRoleFixtures = {
  adminPage: Page;
  researcherPage: Page;
  techPage: Page;
  guestPage: Page;
};

export const test = base.extend<MultiRoleFixtures>({
  adminPage: async ({ browser }, use) => {
    const ctx = await browser.newContext({
      storageState: '.auth/admin.json',
    });
    const page = await ctx.newPage();
    await use(page);
    await ctx.close();
  },
  researcherPage: async ({ browser }, use) => {
    const ctx = await browser.newContext({
      storageState: '.auth/researcher.json',
    });
    const page = await ctx.newPage();
    await use(page);
    await ctx.close();
  },
  techPage: async ({ browser }, use) => {
    const ctx = await browser.newContext({
      storageState: '.auth/tech.json',
    });
    const page = await ctx.newPage();
    await use(page);
    await ctx.close();
  },
  guestPage: async ({ browser }, use) => {
    const ctx = await browser.newContext({
      storageState: '.auth/guest.json',
    });
    const page = await ctx.newPage();
    await use(page);
    await ctx.close();
  },
});
```

#### 3.3 关键测试场景

**角色权限矩阵测试**：

| 操作 | Admin | Researcher | Tech | Guest |
|------|-------|------------|------|-------|
| 创建项目 | YES | YES | NO | NO |
| 删除项目 | YES | 仅自己的 | NO | NO |
| 创建实验 | YES | YES | NO | NO |
| 签署实验 | YES | YES | NO | NO |
| 创建样品 | YES | YES | YES | NO |
| 管理仪器 | YES | NO | YES | NO |
| 管理库存 | YES | NO | YES | NO |
| 查看审计日志 | YES | NO | NO | NO |
| 团队设置 | YES | NO | NO | NO |
| 邀请成员 | YES | NO | NO | NO |

每个格子对应一个 E2E 断言。

**协作交互测试**：

```typescript
// invite-accept.spec.ts
test('admin invites researcher, researcher sees team data', async ({ adminPage, researcherPage }) => {
  // Admin 在团队设置中创建邀请
  await adminPage.goto('/teams');
  // ... 创建邀请链接

  // Researcher 通过邀请链接加入
  await researcherPage.goto(inviteLink);
  // ... 接受邀请

  // 验证 Researcher 可以看到团队项目
  await researcherPage.goto('/dashboard');
  await expect(researcherPage.getByText('Protein Expression')).toBeVisible();
});
```

**数据隔离测试**：

```typescript
// team-data-isolation.spec.ts
test('team A project not visible in team B', async ({ adminPage }) => {
  // 在 Team A 创建项目
  // 切换到 Team B
  // 断言项目列表不包含 Team A 的项目
  // 直接访问 Team A 项目 URL → 403 或重定向
});
```

#### 3.4 测试数量预估

| 类别 | 现有 | 新增 | 合计 |
|------|------|------|------|
| 导航与布局 | 50 | 0 | 50 |
| 样品操作 | 30 | 10 | 40 |
| 实验 CRUD | 25 | 15 | 40 |
| 项目/任务 | 15 | 20 | 35 |
| 仪器 | 15 | 10 | 25 |
| 画布/看板 | 0 | 25 | 25 |
| 角色权限 | 20 | 40 | 60 |
| 团队 CRUD | 10 | 20 | 30 |
| 协作交互 | 0 | 25 | 25 |
| 数据隔离 | 0 | 15 | 15 |
| 生命周期 | 5 | 15 | 20 |
| 其他 | 135 | 0 | 135 |
| **合计** | **305** | **~195** | **~500** |

---

## 四、实施顺序

| 阶段 | 内容 | 预计工作量 |
|------|------|-----------|
| **P1** | 修复画布 4 个 Bug + 添加连线功能 | 中 |
| **P2** | 修复看板跨列拖拽 | 小 |
| **P3** | E2E Fixture 架构改造 | 小 |
| **P4** | 画布 E2E 测试（25 个） | 中 |
| **P5** | 角色权限 E2E 测试（40 个） | 大 |
| **P6** | 团队 CRUD + 协作 E2E 测试（45 个） | 大 |
| **P7** | 数据隔离 E2E 测试（15 个） | 中 |
| **P8** | 补充生命周期和其他 E2E 测试 | 中 |

建议先完成 P1-P4（画布修复+测试），再推进 P5-P8（角色/协作/隔离测试）。

---

## 五、风险与注意事项

1. **React Flow 与 @dnd-kit 冲突**：画布内使用 React Flow 自带拖拽，看板继续用 @dnd-kit，两者不要混用
2. **E2E 测试并行隔离**：多角色测试使用独立 browser context，不共享 state
3. **种子数据依赖**：新增 E2E 测试需要扩展 seed 数据（多团队、Guest 用户等）
4. **CI 耗时**：从 305 到 500 测试，CI 时间可能翻倍，考虑分 shard 并行
