# 现有实验室管理仓库分析报告

**分析日期**：2026-03-04
**分析对象**：GitHub 账户 `hanjiajun1990216-cloud` 下的两个历史仓库
**仓库地址**：

- `hanjiajun1990216-cloud/lab-manager`（描述：V0 Gemini）
- `hanjiajun1990216-cloud/lab-managergpt`

---

## 一、仓库概览对比

| 维度         | lab-manager（Gemini版）        | lab-managergpt（GPT版）      |
| ------------ | ------------------------------ | ---------------------------- |
| 提交数       | 10 次（有迭代记录）            | 1 次（初始提交）             |
| 后端文件大小 | 19 KB（473行）                 | 35 KB（1186行）              |
| 前端文件大小 | 50 KB（含 style.css 6KB 单独） | 115 KB（单文件）             |
| 数据库       | SQLite（sqlite.db）            | SQLite（labmanager.db）      |
| 认证方式     | JWT（OAuth2 + bcrypt）         | 无认证（明文密码，内部使用） |
| 部署工具     | cpolar 内网穿透（含安装包）    | 无特殊部署配置               |
| README       | 无                             | 无                           |

---

## 二、lab-manager（Gemini版）详细分析

### 2.1 目录结构

```
lab-manager/
├── main.py                          # 全栈后端（FastAPI，473行）
├── frontend/
│   ├── index.html                   # 前端单页应用（1119行）
│   └── style.css                    # 独立样式表（6KB）
├── assets/
│   └── webui.url                    # 快捷方式（localhost:9200）
├── webui.url                        # Windows快捷方式文件
├── cpolar.exe                       # cpolar 内网穿透（19MB，Windows可执行）
├── cpolar_amd64.msi                 # cpolar 安装包
├── cpolar-stable-windows-amd64-setup.zip  # 压缩包
└── .gitignore
```

**注**：仓库中直接提交了 cpolar.exe 等二进制文件，说明最初面向 Windows 环境在本地局域网运行。

### 2.2 技术栈

**后端**：

- Python + FastAPI（带 Jinja2 模板 + StaticFiles）
- SQLAlchemy ORM + SQLite
- JWT 认证（python-jose）+ bcrypt 密码哈希（passlib）
- OAuth2PasswordBearer 标准鉴权流程
- pandas（Excel 导入时懒加载）

**前端**：

- 纯 HTML + CSS + 原生 JavaScript（无框架）
- Quill.js 1.3.6（富文本编辑器，CDN 引入）
- Drag & Drop API（原生实现看板拖拽）
- CSS 变量 + Flexbox 布局

**运行端口**：localhost:9200
**部署方式**：cpolar 内网穿透，对外暴露局域网服务

### 2.3 数据库模型（ORM Schema）

```python
User           # 用户（id, username, email, password[hashed], role, created_at）
Team           # 团队（id, name, created_at）
TeamMembership # 团队成员关系（team_id, user_id, role）
Project        # 项目（id, name, owner, created_at）
Task           # 任务（id, project_id, title, status[todo/doing/done],
               #       assignees_json, participants_json, protocol_id）
TaskStep       # 任务步骤/子任务（id, task_id, content, status, due_date）
TaskComment    # 任务评论（id, task_id, user_name, content, created_at）
ProjectNotebook# 项目笔记本（id, project_id, content[HTML富文本]）
Protocol       # 实验模板（id, name, owner, description）
ProtocolVersion# 模板版本（id, protocol_id, version_index, content[HTML], comment）
Instrument     # 仪器（id, name, location）
InstrumentComment # 仪器留言（id, instrument_id, author, content）
Booking        # 仪器预约（id, instrument[name], start_time, end_time, user_name）
InventoryItem  # 库存条目（id, name, category, quantity[Float], unit, location）
InventoryLog   # 出入库记录（id, item_id, change[Float], user_name, note）
```

**设计特点**：

- 任务的多负责人用 JSON 字符串存储（`assignees_json = "[1, 2]"`），非标准关联表
- 预约记录通过仪器名称（字符串）关联，而非外键——存在数据一致性隐患
- 库存数量支持 Float（支持小数，适合试剂称重计量）
- 版本号通过 `version_index` 自增维护

### 2.4 API 端点设计

```
# 认证
POST /token                          # OAuth2 登录（返回 JWT）
POST /register                       # 注册用户

# 团队管理
GET  /my/teams                       # 获取当前用户团队
POST /teams                          # 创建团队
GET  /teams/{tid}/members            # 获取团队成员

# 项目管理
GET  /projects                       # 项目列表
POST /projects                       # 创建项目

# 任务管理
POST /projects/{pid}/tasks           # 创建任务（含多负责人）
GET  /tasks/{tid}/details            # 任务详情（含步骤+评论）
POST /tasks/{tid}/steps              # 添加任务步骤
PATCH /steps/{sid}/toggle            # 切换步骤状态
POST /tasks/{tid}/comments           # 添加评论

# 项目笔记本
GET  /projects/{pid}/notebook        # 获取笔记本内容
POST /projects/{pid}/notebook        # 保存笔记本内容

# 实验模板
GET  /protocols                      # 模板列表
POST /protocols                      # 创建模板
GET  /protocols/{pid}/versions       # 版本历史
POST /protocols/{pid}/versions       # 保存新版本（含权限检查）

# 库存管理
GET  /inventory                      # 库存列表
POST /inventory                      # 新增条目
POST /inventory/import               # Excel 批量导入
GET  /inventory/{iid}/logs           # 出入库记录
POST /inventory/{iid}/logs           # 记录出入库

# 仪器管理
GET  /instruments                    # 仪器列表
POST /instruments                    # 新增仪器
GET  /instruments/{iid}/bookings     # 仪器预约列表
POST /bookings                       # 创建预约
GET  /instruments/{iid}/comments     # 仪器留言
POST /instruments/{iid}/comments     # 发布留言
```

### 2.5 前端页面与功能

**导航结构（4个主视图）**：

1. **📁 项目管理** - 项目列表 + 任务看板（Kanban）+ 项目笔记本
2. **📚 实验模板** - 模板列表 + 富文本版本编辑器（Quill.js）
3. **📦 库存管理** - 耗材列表 + 出入库记录 + Excel 导入
4. **🔬 仪器预约** - 仪器列表 + 日历视图预约

**核心交互功能**：

- 用户注册/登录（JWT token 存储在 localStorage）
- 团队创建与切换（团队选择器在顶部导航栏）
- 任务看板：拖拽卡片更新状态（todo/doing/done）
- 任务详情模态框：步骤管理（带截止时间）+ 评论区
- 项目笔记本：Quill.js 富文本，自动保存（笔记本与项目绑定）
- 协议版本控制：每次保存生成新版本，不覆盖历史
- 仪器日历：月视图，按日显示预约
- Excel 导入库存：支持列名"名称/分类/数量/单位/位置"

**UI 设计风格**：

- 专业蓝色（`#2563eb`）主题
- 240px 左侧导航栏 + 60px 顶部导航
- CSS 变量统一管理颜色/尺寸
- Toast 通知（底部居中弹出）
- 模态框带 backdrop-filter 毛玻璃效果

### 2.6 代码质量评估

**优点**：

- 后端结构清晰，Pydantic 模型与 ORM 模型分离
- JWT 认证实现完整，bcrypt 加密安全
- Excel 导入使用懒加载（`import pandas as pd`）减少启动时间
- 代码有中文注释，可读性好
- 权限检查（协议版本只有 owner/admin 可修改）

**缺点/技术债**：

- 多负责人用 JSON 字符串存储（`assignees_json`）而非关联表，难以查询
- 仪器预约通过名称字符串关联（不用外键），存在一致性风险
- `db.query(Task).get(tid)` 已废弃（SQLAlchemy 2.0+）
- 没有输入验证（如预约时间冲突检测）
- SECRET_KEY 硬编码在代码中
- 密码虽然 bcrypt 哈希但 SECRET_KEY 明文可见

---

## 三、lab-managergpt（GPT版）详细分析

### 3.1 目录结构

```
lab-managergpt/
├── main.py                          # 后端（FastAPI，1186行）
└── frontend/
    └── index.html                   # 前端单页应用（3161行，114KB）
```

**注**：最简化结构，无额外配置文件，无部署工具。

### 3.2 技术栈

**后端**：

- Python + FastAPI
- SQLAlchemy ORM + SQLite
- 无 JWT 认证（明文密码，仅适合内部使用）
- 轻量级数据库迁移（通过 PRAGMA table_info 检测并 ALTER TABLE 添加列）

**前端**：

- 纯 HTML + CSS + 原生 JavaScript
- 无富文本编辑器（使用 `contenteditable` 或普通 textarea）
- 原生 Drag & Drop API
- 双语支持函数（`isZh()`）

**运行端口**：默认 localhost:8000

### 3.3 数据库模型（ORM Schema）

```python
User              # 用户（id, email, username, password[明文!], role）
Team              # 团队（id, name）
TeamMembership    # 团队成员（team_id, user_id, role，含 UniqueConstraint）
Project           # 项目（id, name, description, owner）
Task              # 任务（id, project_id, title, description, status,
                  #       assignee[旧-名字], assignee_id[新-ID],
                  #       participants[旧-逗号], participants_json[新-JSON],
                  #       is_milestone, important, due_date,
                  #       linked_protocol_id, order_index）
Protocol          # 实验模板（id, name, description, owner）
ProtocolVersion   # 模板版本（id, protocol_id, version_index, content, comment）
ProtocolShare     # 模板共享（id, protocol_id, target, note）
Booking           # 仪器预约（id, instrument[name], start_time, end_time, user_name, note）
InventoryItem     # 库存条目（id, name, category, quantity[Int], location, note）
InventoryLog      # 出入库记录（id, item_id, change, quantity_before, quantity_after, user_name, note）
Instrument        # 仪器（id, name, location, note）
InstrumentComment # 仪器留言（id, instrument_id, author, content）
TaskComment       # 任务评论（id, task_id, author, content）
```

**设计亮点（相比 Gemini 版）**：

- `InventoryLog` 记录 `quantity_before` 和 `quantity_after`（前后快照），审计更完整
- `InventoryLog` 有库存不足保护（`after < 0` 时报错）
- `Task` 有 `order_index` 字段，支持持久化排序
- `Task` 有 `is_milestone` 和 `important` 标志
- `ProtocolShare` 独立模型，支持多人共享协议
- `TeamMembership` 有 `UniqueConstraint`（防重复）
- 旧字段（姓名）和新字段（ID）共存，实现向后兼容迁移
- `Task` 支持 `description` 和 `due_date`

### 3.4 API 端点设计

```
# 认证（无 JWT，简单 session 概念）
POST /login                          # 登录（email 或 username 均可）
POST /register                       # 注册

# 团队
GET  /teams/{team_id}/members        # 团队成员
GET  /my/teams                       # 我的团队（全部团队列表）

# 项目
GET  /projects                       # 列表（含 description）
POST /projects                       # 创建
DELETE /projects/{project_id}        # 删除（级联删除任务）

# 任务（增强版）
GET  /projects/{project_id}/tasks    # 任务列表（带 participant_ids 解析）
POST /projects/{project_id}/tasks    # 创建（含里程碑/重要/截止时间/协议关联）
PATCH /tasks/{task_id}               # 更新（全字段 PATCH）
DELETE /tasks/{task_id}              # 删除
POST /projects/{project_id}/tasks/reorder  # 拖拽重排（持久化 order_index）

# 任务评论
GET  /tasks/{task_id}/comments       # 评论列表
POST /tasks/{task_id}/comments       # 添加评论

# 实验模板（增强版）
GET  /protocols                      # 列表
POST /protocols                      # 创建
GET  /protocols/{protocol_id}/versions      # 版本历史
POST /protocols/{protocol_id}/versions     # 保存新版本
GET  /protocols/{protocol_id}/shares       # 共享列表
POST /protocols/{protocol_id}/shares       # 添加共享
GET  /protocols/{protocol_id}/tasks        # 关联任务列表

# 仪器（增强版）
GET  /instruments                    # 列表
POST /instruments                    # 创建（含 note 字段）
DELETE /instruments/{instrument_id}  # 删除
GET  /instruments/{instrument_id}/bookings   # 按仪器ID查预约
POST /instruments/{instrument_id}/comments  # 发留言
GET  /instruments/{instrument_id}/comments  # 留言列表

# 预约
POST /bookings                       # 创建预约
GET  /bookings                       # 全部预约（最近200条）

# 库存
GET  /inventory                      # 列表（最近500条）
POST /inventory                      # 新增
POST /inventory/{item_id}/logs       # 出入库（含库存不足校验）
GET  /inventory/{item_id}/logs       # 记录列表
```

### 3.5 前端页面与功能

**导航结构（4个主视图）**：

1. **项目管理** - 项目列表 + 任务（双视图：表格/Canvas）
2. **实验模板** - 模板 + 版本历史 + 共享管理 + 关联任务
3. **仪器预约** - 仪器列表 + 预约（列表/日历双视图）+ 留言板
4. **样品与耗材** - 库存分栏（样品/耗材自动分类）+ 出入库

**相比 Gemini 版新增的前端功能**：

1. **Canvas 工作流视图**（任务看板替代品）
   - 卡片式拖拽排序（非状态列切换，而是顺序排列）
   - 持久化排序（`persistCanvasOrder` 调用 reorder API）
   - 成员头像（字母缩写 Avatar）显示参与人
   - 点击 Avatar 弹出成员信息卡片

2. **任务创建增强**
   - 里程碑标记（★ 图标）
   - 重要标记
   - 截止时间选择器
   - 关联实验模板下拉框
   - "快速新建模板" / "复制选中模板" 按钮

3. **实验模板管理增强**
   - 版本历史展示（版本内容预览）
   - 模板共享（可指定共享目标）
   - 查看关联任务列表

4. **库存分栏展示**
   - 样品（category = "样品" 或 含 "sample"）自动归左栏
   - 耗材归右栏
   - 出入库记录含"变动前/变动后"数量快照

5. **成员信息弹窗**（`showMemberInfo`）
   - 点击参与人头像显示成员详情

6. **双语支持**（`isZh()` 函数预留）

**UI 设计风格**：

- 深蓝渐变顶部栏（`#0b4fad` → `#1f6feb`）
- 230px 左侧导航栏（含蓝色圆点装饰）
- 卡片标题含蓝色圆点装饰（`.card-title-dot`）
- 整体偏"企业管理系统"风格

### 3.6 代码质量评估

**优点**：

- Pydantic Output 模型（`ProjectOut`, `TaskOut` 等）完整定义，API 文档友好
- 库存日志记录完整（quantity_before/after）
- Task 字段更丰富（milestone, important, due_date, order_index）
- 轻量级数据库迁移（自动检测列缺失并 ALTER TABLE）
- 任务拖拽排序后端持久化
- 项目删除级联正确（cascade="all, delete"）

**缺点/技术债**：

- **明文存储密码**（注释已说明"内部使用，简化处理"）
- 无 JWT 认证（每次操作不验证身份）
- `db.query(Task).get(task_id)` 已废弃语法
- Booking 仍通过仪器名称关联（非外键）
- 前端 3161 行单文件，维护困难
- `task.updated_at` 没有 `onupdate` 自动触发（需手动 `task.updated_at = datetime.utcnow()`）

---

## 四、两版本核心差异对比

| 功能点              | lab-manager（Gemini版） | lab-managergpt（GPT版）      |
| ------------------- | ----------------------- | ---------------------------- |
| **认证安全**        | JWT + bcrypt（正规）    | 明文密码（仅内网）           |
| **库存数量类型**    | Float（支持小数/克）    | Integer（仅整数）            |
| **库存日志**        | 仅记录变动量            | 记录变动前后快照             |
| **任务步骤**        | 有（TaskStep 子模型）   | 无                           |
| **项目笔记本**      | 有（Quill 富文本）      | 无                           |
| **任务排序**        | 无持久化                | order_index 持久化           |
| **任务看板视图**    | Kanban（3列状态）       | Canvas（单列排序）+ 表格视图 |
| **里程碑/重要标记** | 无                      | 有                           |
| **模板共享**        | 无                      | 有（ProtocolShare 模型）     |
| **协议权限控制**    | 有（owner/admin检查）   | 无                           |
| **仪器删除**        | 无                      | 有                           |
| **项目删除**        | 无                      | 有                           |
| **成员头像**        | 无                      | 有（字母缩写）               |
| **Excel 导入**      | 有（pandas）            | 无                           |
| **富文本编辑**      | Quill.js（成熟方案）    | 普通 textarea                |
| **前端代码量**      | 1119行 + style.css      | 3161行（单文件）             |
| **数据库迁移**      | 无（初建即最终形态）    | 有（ALTER TABLE检测）        |

---

## 五、可复用的代码与设计思路

### 5.1 可直接复用的代码片段

**后端（Python/FastAPI）**：

1. **数据库配置与初始化模板**（两个版本均可参考）

```python
DATABASE_URL = "sqlite:///./app.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

2. **JWT 认证完整实现**（来自 Gemini 版，可直接迁移）

```python
from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
SECRET_KEY = "..."  # 改为环境变量
ALGORITHM = "HS256"

def get_current_user(token, db):
    # 完整的 JWT 解码 + 用户查询逻辑
```

3. **JSON 列表工具函数**（两个版本相同）

```python
def _ids_to_json(ids):
    return json.dumps(ids) if ids else "[]"

def _json_to_ids(s):
    try: return json.loads(s)
    except: return []
```

4. **轻量级数据库迁移**（来自 GPT 版）

```python
# 检测并自动添加新列（用于版本升级兼容）
info = conn.execute(text("PRAGMA table_info(tasks)")).fetchall()
cols = {row[1] for row in info}
if "new_column" not in cols:
    conn.execute(text("ALTER TABLE tasks ADD COLUMN new_column TEXT"))
```

5. **库存出入库（含前后快照）**（GPT 版）

```python
before = item.quantity or 0
after = before + data.change
if after < 0:
    raise HTTPException(400, "库存不足")
item.quantity = after
log = InventoryLog(..., quantity_before=before, quantity_after=after)
```

6. **任务拖拽排序**（GPT 版）

```python
@app.post("/projects/{project_id}/tasks/reorder")
def reorder_tasks(project_id: int, data: TaskOrderUpdate, db: Session):
    tasks = db.query(Task).filter(Task.project_id == project_id).all()
    id_to_task = {t.id: t for t in tasks}
    for idx, tid in enumerate(data.order):
        if t := id_to_task.get(tid):
            t.order_index = idx
    db.commit()
```

**前端（HTML/CSS/JS）**：

7. **CSS 变量体系**（Gemini 版，简洁清晰）

```css
:root {
  --primary: #2563eb;
  --primary-hover: #1d4ed8;
  --bg-body: #f3f4f6;
  --bg-card: #ffffff;
  --text-main: #111827;
  --text-sub: #6b7280;
  --border: #e5e7eb;
  --danger: #ef4444;
  --success: #10b981;
}
```

8. **Toast 通知实现**

```javascript
function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2500);
}
```

9. **模态框打开/关闭**

```javascript
function openModal(id) {
  document.getElementById(id).style.display = "flex";
}
function closeModal(id) {
  document.getElementById(id).style.display = "none";
}
```

10. **带 JWT 的 fetch 封装**（Gemini 版）

```javascript
async function authFetch(url, options = {}) {
  const token = localStorage.getItem("token");
  options.headers = { ...options.headers, Authorization: `Bearer ${token}` };
  const resp = await fetch(url, options);
  if (resp.status === 401) {
    handleLogout();
    return null;
  }
  return resp;
}
```

11. **Canvas 任务拖拽排序**（GPT 版，持久化到后端）

```javascript
// dragstart / dragend / dragover / drop 事件处理
// 拖放后调用 persistCanvasOrder() 发送 reorder API
```

12. **成员头像 Avatar 渲染**（GPT 版）

```javascript
const letter = (member.username || "?").slice(0, 1).toUpperCase();
return `<div class="avatar" title="${member.username}">${letter}</div>`;
```

### 5.2 可复用的架构设计思路

1. **单文件后端方案**
   - 适合快速原型/小团队内部工具
   - 全部 ORM 模型 + Pydantic 模型 + 路由放在 `main.py`
   - 可直接 `uvicorn main:app` 运行

2. **静态前端 + FastAPI 托管**
   - FastAPI 同时托管前端 HTML 文件（`StaticFiles` + `FileResponse`）
   - 不需要额外 Web 服务器（Nginx 等）
   - 适合内网部署场景

3. **版本化实验模板设计**
   - `Protocol` + `ProtocolVersion` 双表结构
   - 每次保存生成新 `version_index`（不覆盖历史）
   - 可回溯任意历史版本

4. **任务与协议的关联设计**
   - `Task.linked_protocol_id → Protocol.id`
   - 可通过 `/protocols/{id}/tasks` 查看"使用了此协议的所有任务"
   - 适合实验室"按照标准操作步骤执行任务"的场景

5. **旧数据兼容迁移模式**（GPT 版）
   - 新字段（ID化）与旧字段（名称字符串）共存
   - 接口同时接受两种格式
   - 适合在线系统平滑升级

6. **库存分栏展示逻辑**
   - 按 `category` 字段自动分类（"样品" vs 其他）
   - 前端渲染时按规则分流到两个 table
   - 简单但实用的 UX 设计

---

## 六、关键发现与建议

### 6.1 原始痛点确认

从两个版本的迭代轨迹，可以观察到用户真实遇到的痛点：

1. **多负责人支持**（Gemini版 V0→V1 的主要改进方向）
2. **任务状态看板**（Kanban 是核心使用场景）
3. **仪器预约日历**（日历视图是必需功能）
4. **实验模板版本化**（覆写不是好方案，需要版本历史）
5. **排序持久化**（用户拖拽排序后刷新不丢失）

### 6.2 两版本都未解决的问题

- 无通知/提醒系统（预约到期、任务截止提醒）
- 无搜索/过滤功能
- 无数据导出（只有 Excel 导入，无导出）
- 无移动端适配
- 无图片/文件附件支持
- 无用户权限细粒度管理（仅 admin/member 两级）
- 仪器预约无冲突检测（时间段重叠可以提交）

### 6.3 新系统建设建议

基于两版本的经验教训，建议新的实验室管理系统（ponylab）：

**优先沿用**：

- FastAPI + SQLAlchemy + SQLite 的技术栈（已验证可用）
- JWT 认证方案（Gemini 版实现完整）
- Protocol 版本化设计（`Protocol` + `ProtocolVersion` 双表）
- 出入库记录含 quantity_before/after 快照（GPT 版更完整）
- 任务的 `is_milestone`, `important`, `due_date`, `order_index` 字段
- CSS 变量体系（便于主题定制）

**需要改进**：

- 多负责人改用标准关联表（非 JSON 字符串）
- 仪器预约改用 `instrument_id` 外键（非名称字符串）
- 库存数量改为 Float（支持试剂小数计量）
- 密码必须使用 bcrypt 哈希（非明文）
- 前端模块化（避免单文件超过 3000 行）
- 仪器预约加入冲突检测

**全新功能**：

- 搜索与过滤
- 数据导出（Excel/CSV）
- 附件上传（实验图片、原始数据文件）
- 通知提醒（截止时间、预约提醒）
- 统计仪表板（项目进度、库存概览）

---

## 七、附录：关键文件路径

| 文件         | 路径                                      |
| ------------ | ----------------------------------------- |
| Gemini版后端 | `/tmp/lab-manager/main.py`                |
| Gemini版前端 | `/tmp/lab-manager/frontend/index.html`    |
| Gemini版样式 | `/tmp/lab-manager/frontend/style.css`     |
| GPT版后端    | `/tmp/lab-managergpt/main.py`             |
| GPT版前端    | `/tmp/lab-managergpt/frontend/index.html` |

_克隆位于 `/tmp/` 目录，重启后会被清理，需要时重新克隆。_
