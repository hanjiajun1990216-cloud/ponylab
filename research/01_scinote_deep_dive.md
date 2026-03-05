# SciNote ELN 深度调研报告

**调研日期**：2026-03-04
**调研范围**：产品定位、技术架构、UI/UX、商业模式、用户评价与竞争格局
**数据来源**：官方网站、GitHub、G2、Capterra、技术文档、第三方评测

---

## 目录

1. [产品定位与核心功能](#1-产品定位与核心功能)
2. [技术架构](#2-技术架构)
3. [UI/UX 设计](#3-uiux-设计)
4. [商业模式与市场数据](#4-商业模式与市场数据)
5. [用户评价与痛点](#5-用户评价与痛点)
6. [竞品对比](#6-竞品对比)
7. [对 LIMS 产品的启示](#7-对-lims-产品的启示)
8. [参考资料](#8-参考资料)

---

## 1. 产品定位与核心功能

### 1.1 产品定位

SciNote 是一款**开源电子实验记录本（ELN）+ 实验室管理平台**，定位于以下用户群：

- **核心目标用户**：生命科学研究人员（生物学家、医学研究员、化学家）
- **机构类型**：学术研究机构（高校/研究院）、制药/生物技术公司、政府监管实验室（FDA、USDA）
- **规模范围**：个人研究员 → 大型企业实验室

公司口号："designed by biologists for biologists"（由生物学家为生物学家设计），强调科研工作流的原生支持，而非通用项目管理工具的改造。

用户规模：**90,000+ 用户，覆盖 100+ 国家**（2024 年数据），已被 FDA、USDA、欧盟委员会采用。

### 1.2 核心功能模块

#### 模块一：电子实验记录本（ELN 核心）

SciNote 采用三层层级结构组织科研数据：

```
Projects（项目）
  └── Experiments（实验）
        └── Tasks（任务/步骤）
              ├── Notes & Attachments（笔记与附件）
              ├── Protocols（实验方案）
              └── Results（结果数据）
```

关键功能：

- 富文本笔记编辑器，支持 Excel 表格嵌入、图片、PDF、PowerPoint 附件
- Smart Annotations（智能标注）：在笔记中可引用库存项目、协议、实验、团队成员（类似 @mention）
- 实验进度可视化：拖拽式工作流看板
- 一键生成 PDF 实验报告（< 1 分钟）
- 跨项目全文搜索（含文件内容搜索）

#### 模块二：协议管理（Protocol Management）

- 协议库（Protocol Repository）：统一存储和版本管理 SOP、实验方案
- 模板系统：支持文字、表格、检查清单、图片、Excel 格式的协议模板
- 版本控制：协议变更历史追踪
- **protocols.io 集成**：可直接从 protocols.io 公共数据库搜索、预览并导入协议至 SciNote
- AI 辅助协议撰写（较新功能）
- 跨团队协议共享

#### 模块三：库存管理（Inventory Management）

这是 SciNote 区别于许多竞品的重要差异化功能：

- **统一库存中心**：管理试剂、样品、耗材、设备等
- **自定义字段**：支持文本、下拉列表、日期、条形码等字段类型
- **自动库存消耗追踪**：实验任务中使用的库存自动扣减
- **低库存预警**：设置库存阈值，低于时自动提醒
- **到期日提醒**：试剂过期、仪器校准、样品监控提醒
- **父子关系管理**（Item Relationships）：支持样品衍生关系（parent-child lineage）
- **库存与实验关联**：任务结果可追溯到使用的库存项目（全程可追溯性）
- **QR 码标签**：每个库存项目自动生成唯一 QR 码，支持标签打印
- **CSV 导入**：支持从 Excel/CSV 批量导入库存数据

#### 模块四：样品管理（Sample Management）

- 样品位置层级管理：从液氮罐 → -80°C 冰箱 → 冻存盒，可视化存储层级
- 冻存盒可视化布局（box layout visualization）：点击选择具体样品位置
- 跨团队位置共享
- 支持数万级别样品的过滤和管理
- 归档功能（Archiving）：低频使用样品可归档，不影响主视图

#### 模块五：合规与安全（Compliance & Regulatory）

SciNote 对监管合规的支持是其企业版的核心卖点：

- **21 CFR Part 11 合规**：
  - 电子签名（Electronic Signatures）：唯一绑定用户，带时间戳
  - 审计追踪（Audit Trail）：所有操作均有时间戳记录，不可编辑删除
  - 活动日志（Activity Log）：完整用户操作历史
- **GxP 支持**（GMP/GLP 环境）：
  - 唯一用户凭据登录
  - 基于角色的权限管理
  - 会话超时控制
  - 强加密标准
  - 每日多次自动备份
  - 数据归档（保留原始结构）
  - 软件验证和性能测试
- **安全认证**：ISO 27001:2022 认证、SOC 2 合规、正在申请 FedRAMP Authorization

#### 模块六：团队协作（Collaboration）

- 基于角色的权限体系（Role-based permissions）
- 任务分配和截止日期管理
- 评论线程和 @提及通知
- 实时进度可见性
- 跨团队库存共享

#### 模块七：集成与 API

**原生集成**：
| 集成对象 | 用途 |
|---------|------|
| protocols.io | 公共协议数据库导入 |
| Microsoft Office Online | Excel/Word/PPT 在线编辑 |
| Ganymede.bio | 实验仪器数据连接 |
| Quartzy | 库存管理同步 |
| ChemAxon Marvin | 化学结构绘制 |
| Gilson Connect | 移液器数据记录（PIPETMAN M Connected） |
| FLUICS Print | 低温标签云打印 |
| Zebra 标签打印机 | 实验室标签打印 |
| Open Vector Editor | 质粒/DNA 序列编辑 |

**API 能力**：

- RESTful API（JSON 格式）
- 认证：JWT Token + OAuth 2.0 授权码流
- 支持双向数据流（读取 + 写入）
- 可创建/更新任务、协议、样品等对象
- 支持 Webhooks

#### 模块八：移动应用

- iOS 和 Android 均有原生 App
- 功能：完成协议步骤、上传文件、发布实验结果、实时同步
- 注：用户反馈 iPad 版功能尚不完整

### 1.3 开源版 vs 商业版功能差异

| 功能维度            | 开源版（社区） | 商业版（Premium） |
| ------------------- | -------------- | ----------------- |
| 核心 ELN 功能       | 完整           | 完整              |
| 协议管理            | 完整           | 完整              |
| 基础库存管理        | 完整           | 完整              |
| 21 CFR Part 11 合规 | 不包含         | Premium 附加模块  |
| 电子签名 / 审计追踪 | 有限           | 完整              |
| 客户成功支持        | 社区支持       | 专属 CSM          |
| 数据托管            | 自托管         | 云端 + 自托管可选 |
| SLA 保障            | 无             | 有                |
| SSO 集成            | 无             | 有（Enterprise）  |
| 高级 API 访问       | 基础           | 完整              |
| 定制化开发支持      | 无             | 有（Enterprise）  |

许可证：**Mozilla Public License 2.0**（MPL-2.0）

---

## 2. 技术架构

### 2.1 技术栈概览

| 层级         | 技术选型                                                 |
| ------------ | -------------------------------------------------------- |
| **后端框架** | Ruby on Rails（当前版本基于 Rails 6+，早期版本为 4.2.3） |
| **数据库**   | PostgreSQL                                               |
| **前端框架** | Bootstrap 3 + jQuery（历史遗留；新版本引入 React 组件）  |
| **后台任务** | Sidekiq（基于 Redis 的后台 Job 处理）                    |
| **文件存储** | 本地文件系统 / AWS S3（云版本）                          |
| **搜索**     | 全文搜索（PostgreSQL tsvector 或 ElasticSearch）         |
| **容器化**   | Docker + Docker Compose                                  |
| **代码规范** | RuboCop（Ruby）、ESLint（JavaScript）、scss-lint（Sass） |

### 2.2 GitHub 仓库信息

- **仓库地址**：`github.com/scinote-eln/scinote-web`
- **Stars**：约 295（截至调研时）
- **Forks**：约 109
- **Open PRs**：约 20
- **开发组织**：`scinote-eln`（原 `scinote-dev`）
- **许可证**：Mozilla Public License 2.0

### 2.3 Docker 架构（开发环境）

SciNote 使用 Docker Compose 管理开发环境，核心容器：

```yaml
容器组合（v1.10.0+ 版本）：

scinote_web_development      # Rails Web 应用（端口 3000）
scinote_db_development       # PostgreSQL 数据库进程
scinote_development_postgres # 持久化数据库 Volume
scinote_development_files    # 持久化文件存储 Volume
scinote_development_bundler  # Ruby Gems 依赖 Volume
[job worker container]       # Sidekiq 后台任务处理
```

**本地启动命令序列**：

```bash
make docker          # 下载镜像 + 安装 Gems
make run             # 启动服务
make cli             # 进入容器 Shell
  rails db:create
  rails db:migrate
  rails db:seed
make worker          # 启动后台任务
```

### 2.4 生产部署方式

支持多种生产部署路径：

1. **Docker 自托管**：在自有服务器上运行 Docker Compose
2. **Heroku**：官方文档提及 Heroku 部署支持
3. **AWS**：云版本部署于 AWS（ISO 27001 认证要求）
4. **SciNote 托管云**：订阅 SaaS，无需自行运维

### 2.5 数据库模型（推测核心表结构）

基于功能逆推，核心数据模型如下：

```
Team（团队/组织）
  ├── User（用户，多对多关系）
  └── Project（项目）
        └── Experiment（实验）
              └── MyModule / Task（任务）
                    ├── Protocol（实验方案）
                    │     └── Step（步骤）
                    │           └── StepAsset（步骤附件）
                    ├── Result（结果）
                    │     └── ResultAsset / ResultTable（结果附件/表格）
                    └── TaskInventoryItem（任务关联库存项）

Repository（库存仓库）
  └── RepositoryRow（库存项目/样品行）
        ├── RepositoryCell（字段值）
        │     └── RepositoryColumn（字段定义）
        └── RepositoryStockValue（库存数量）

Protocol（协议模板库）
ActivityLog（审计日志，不可删除）
Asset（文件附件，关联 S3 / 本地存储）
```

### 2.6 API 设计

- **风格**：RESTful JSON API
- **认证**：OAuth 2.0（Authorization Code Flow）+ JWT Bearer Token
- **文档**：scinote-eln.github.io/scinote-api-docs/
- **端点覆盖**：Projects、Experiments、Tasks、Protocols、Inventory（Repositories）等核心资源

---

## 3. UI/UX 设计

### 3.1 信息架构

SciNote 的主导航结构（侧边栏）：

```
主导航
├── Projects（所有项目列表）
│     └── 进入项目 → Experiments 列表
│           └── 进入实验 → Tasks 看板/列表
│                 └── 进入任务 → 协议、结果、库存关联
├── Protocols（协议仓库）
├── Inventory（库存管理）
│     └── Repositories（库存仓库列表，可有多个）
├── Reports（报告生成）
├── Team Members（团队管理）
└── Settings（设置）
```

### 3.2 核心工作流

**典型科研工作流**：

```
1. 创建实验
   新建 Project → 新建 Experiment → 添加 Tasks

2. 准备实验方案
   从协议库选择 Protocol → 关联到 Task → 分配给实验成员

3. 执行实验
   执行人按步骤完成 Protocol steps →
   标注使用的库存项目（自动扣减库存）→
   上传结果（图片、数据文件）→
   添加结论笔记

4. 数据追踪
   Smart Annotations 关联相关实验 →
   全文搜索历史数据

5. 生成报告
   选择 Project/Experiment → 自动生成 PDF 报告

6. 合规审查（Enterprise 功能）
   电子签名确认 → 审计追踪自动记录所有操作
```

### 3.3 设计风格

- **视觉风格**：Bootstrap 3 基础，扁平化设计，科研工具感强
- **色彩方案**：白底 + 蓝色主色调（专业/医疗感）
- **交互模式**：
  - 拖拽（Drag & Drop）用于工作流排序和样品位置管理
  - @mention 智能标注
  - 内联编辑（Inline editing）
  - 模态弹窗（Modal dialogs）用于快速操作
- **可视化**：库存盒子布局（box visualization）、项目进度仪表盘

### 3.4 已知 UX 问题（来自用户反馈）

- 表格编辑体验较差（不如 Excel 原生）
- 缺乏与 Google Calendar 的日历集成
- 频繁更新导致界面变化令用户困惑
- 文件导航路径较深，寻找文件有时困难
- 移动端（尤其 iPad）功能不完整
- 自定义模板灵活性不足

---

## 4. 商业模式与市场数据

### 4.1 公司背景

| 项目           | 详情                                                      |
| -------------- | --------------------------------------------------------- |
| **成立时间**   | 2015 年（Kickstarter 众筹启动）                           |
| **创始团队**   | BioSistemika LLC（斯洛文尼亚 Ljubljana + 美国波士顿）     |
| **现任所有者** | **Gilson Inc.**（美国著名实验室仪器公司，已收购 SciNote） |
| **CEO**        | Klemen Zupancic, PhD                                      |
| **公司人员**   | ~50 人，60% 具有科学背景，45% 管理层为女性                |
| **总部**       | Middleton, Wisconsin（Gilson 总部所在地）                 |
| **用户规模**   | 90,000+ 用户，100+ 国家                                   |
| **客户满意度** | 99%（官方数据），G2 综合评分 4.4/5，Capterra 4.5/5        |

Gilson 收购 SciNote 的战略意图：将 SciNote 软件与 Gilson 的实验室仪器（如 PIPETMAN 移液器）深度整合（已实现 Gilson Connect 集成），打造硬件+软件一体化实验室解决方案。

### 4.2 定价策略

SciNote 不公开标准定价表，采用"联系销售获取报价"模式。已知信息：

**产品线分层**：

| 层级                   | 目标群体             | 特点                           |
| ---------------------- | -------------------- | ------------------------------ |
| **Free（免费版）**     | 个人研究员           | 核心 ELN 功能，用户/存储有限制 |
| **Academia（学术版）** | 高校/研究院          | 学术折扣定价，含教学班级功能   |
| **Industry Essential** | 中小型企业实验室     | 完整功能，无合规模块           |
| **Industry Validated** | 受监管行业（制药等） | 含 21 CFR Part 11 合规套件     |
| **Industry Platinum**  | QA/企业级            | 全功能 + QA 工具 + 优先支持    |

**参考价格**（第三方数据，非官方）：

- 起步价约 $12/用户/月（基础版）
- 免费版及 14 天免费试用
- 企业版价格需询价，按用户数量定制

**定价模型缺点**（用户投诉）：

- 按用户数计费，对需要全员访问的小企业成本较高
- 合规功能作为付费附加模块，增加成本
- 价格透明度低

### 4.3 市场定位

```
价格维度（低 → 高）
低 ←————————————————————————→ 高

SciNote Free | SciNote Premium | Labguru | LabArchives | Benchling
                                                        $5,000-7,000/用户/年

复杂度维度（简单 → 复杂）
简单 ←————————————————————————→ 复杂

RSpace | SciNote | Labguru | Labarchives | Benchling | IDBS
```

SciNote 定位：**中端市场**——比 Benchling 便宜且更易用，比 RSpace 功能更丰富，在学术和中小企业市场竞争力强。

### 4.4 竞争优势

1. **开源可自托管**：数据主权，无供应商锁定风险
2. **Mozilla Public License**：商业友好的开源协议
3. **低门槛入场**：免费版可试用核心功能
4. **库存管理集成**：库存与实验数据深度关联（很多竞品需要额外模块）
5. **Gilson 背书**：获得知名仪器公司支持，增加品牌可信度
6. **合规覆盖**：支持 21 CFR Part 11，可服务受监管行业

---

## 5. 用户评价与痛点

### 5.1 综合评分

| 平台       | 评分                 | 评论数 |
| ---------- | -------------------- | ------ |
| Capterra   | 4.5 / 5              | 62 条  |
| G2         | 4.4 / 5              | 133 条 |
| 综合满意度 | 9.5 / 10（官方引用） | -      |

### 5.2 用户高度认可的方面（Pros）

**组织结构清晰**：

- "Project → Experiment → Task 三层结构自然反映了实验室的工作方式"
- "超链接功能让跨实验引用历史数据非常方便"
- "可以快速创建实验之间的超链接，引用历史工作极为简单"

**库存管理实用**：

- "库存管理简单直观，库存可见性和消耗追踪大大简化了工作"
- "与实验任务的关联使得溯源成为可能"

**部署和上手速度**：

- "实施速度快，比竞品更容易上手"
- "学习曲线较短，团队培训成本低"

**协议模板**：

- "标准化协议模板显著减少了实验错误和培训时间"

### 5.3 主要痛点与抱怨（Cons）

**功能性限制**：

1. **表格体验差**："表格很难用，Excel 功能无法完全复现"
2. **自定义能力不足**："无法自定义软件功能，模板列定制性有限"
3. **无日历集成**："无法将任务同步到 Google Calendar，截止日期管理不便"
4. **数据分析弱**："缺乏高级自动化和 AI 驱动分析能力"
5. **仪器集成有限**："与代码化软件和数据分析工具接口不佳"

**体验问题**：6. **频繁更新烦扰**："更新频繁但改进不明显，每次都需要重新适应界面" 7. **文件导航困难**："文件层级深，有时找不到历史文件" 8. **移动端不完善**："iPad 版功能不完整" 9. **缩放和路由问题**："导航体验因缩放和路由限制而受挫"

**商业问题**：10. **价格高**："按用户计费对小企业来说成本太高" 11. **功能与价格不匹配**："价格偏高但定制空间有限"

### 5.4 用户分群特征

- **满意的用户群**：学术研究人员（容忍度高，功能需求单一）、中小型 Biotech 团队
- **不满意的用户群**：需要重度数据分析的团队、需要仪器集成的自动化实验室、需要高度定制化工作流的大型企业

---

## 6. 竞品对比

### 6.1 主要竞品矩阵

| 竞品            | 定价                 | 开源     | 合规      | 库存 | AI 功能 | 适用场景         |
| --------------- | -------------------- | -------- | --------- | ---- | ------- | ---------------- |
| **SciNote**     | $12+/用户/月         | 是       | 21CFR P11 | 内置 | 有限    | 学术+中小企业    |
| **Benchling**   | $5,000-7,000/用户/年 | 否       | 企业级    | 完整 | 强      | 大型制药/Biotech |
| **LabArchives** | $5+/用户/月          | 否       | GxP       | 基础 | 无      | 学术研究         |
| **Labguru**     | 询价                 | 否       | 有        | 内置 | 有限    | 中型企业         |
| **RSpace**      | 按量计费             | 是(部分) | 有        | 无   | 无      | 学术机构         |
| **Labii**       | $99+/月              | 否       | 有        | 内置 | 有      | 中型企业         |

### 6.2 SciNote vs Benchling（主要对手）

| 维度           | SciNote            | Benchling                |
| -------------- | ------------------ | ------------------------ |
| 价格           | 低（$12+/用户/月） | 极高（$5K-7K/用户/年）   |
| 易用性         | 高                 | 中（学习曲线陡）         |
| 生物信息学     | 弱                 | 极强（基因组学原生支持） |
| 分子生物学工具 | 基础（OVE 插件）   | 全面（原生设计）         |
| 合规工具       | 中等               | 强                       |
| 市场目标       | 学术/中小 Biotech  | 大型制药/大型 Biotech    |
| 开源           | 是                 | 否                       |
| 库存集成       | 内置，较好         | 内置，功能更强           |

**结论**：SciNote 和 Benchling 的竞争重叠有限，SciNote 的真正用户多数因为价格、易用性、开源性而选择它，而不是 Benchling 的替代品。

### 6.3 SciNote 的市场空白

根据用户反馈和竞品分析，SciNote 目前未能很好覆盖的需求：

1. **高级工作流自动化**（Rule-based automation、触发器）
2. **实验仪器实时数据接入**（来自质谱仪、测序仪的原始数据）
3. **内置统计分析和可视化**（R/Python 集成）
4. **AI 驱动的实验设计建议**
5. **LIMS 完整功能**（样品接收、检测工单、质控管理）

---

## 7. 对 LIMS 产品的启示

本节是对 SciNote 调研后的产品设计思考，供产品规划参考。

### 7.1 SciNote 做对的事（可学习）

1. **三层数据模型**（Project/Experiment/Task）：符合科研自然工作流，新用户能快速理解
2. **库存与实验深度关联**：自动库存追踪是真实痛点解决方案
3. **协议模板化**：标准化 SOP 是实验室质量管理的核心
4. **开源社区策略**：MPL-2.0 许可证既开放又保护商业权益

### 7.2 SciNote 的未填充空间（机会窗口）

1. **表格体验**：科研数据天然是表格形式，SciNote 的表格体验被用户普遍批评，这是机会
2. **数据分析集成**：科研人员经常需要在实验数据上做统计分析，ELN 与分析工具之间仍有断层
3. **仪器数据自动采集**：手工录入是科研 ELN 的核心痛点，自动化数据摄入是下一代竞争力
4. **AI 辅助实验设计**：基于历史实验数据，AI 推荐实验参数或预测结果
5. **更灵活的定价**：按团队/存储量计费而非按用户数，降低中小型实验室的负担

### 7.3 技术架构参考点

- Ruby on Rails + PostgreSQL 的组合经过验证，适合快速迭代
- Docker 化部署降低自托管门槛
- RESTful API + OAuth 2.0 是标准集成模式
- MPL-2.0 授权值得参考（保护商业利益 + 开放社区）

---

## 8. 参考资料

- [SciNote 官方网站](https://www.scinote.net/)
- [SciNote 产品功能页](https://www.scinote.net/product/)
- [SciNote 样品与数据管理平台](https://www.scinote.net/sample-and-data-management-platform/)
- [SciNote 合规与监管页](https://www.scinote.net/product/scinote-in-regulated-environments/)
- [SciNote 集成与 API](https://www.scinote.net/product/integrations-and-api/)
- [SciNote API 文档](https://scinote-eln.github.io/scinote-api-docs/)
- [GitHub: scinote-eln/scinote-web](https://github.com/scinote-eln/scinote-web)
- [SciNote 构建与运行文档](https://scinote.readthedocs.io/en/latest/Build-&-run/)
- [SciNote 开源页面](https://www.scinote.net/open-source-code/)
- [SciNote 关于我们](https://www.scinote.net/about-us/)
- [SciNote 定价页（Premium）](https://www.scinote.net/premium/)
- [Capterra - SciNote 评测](https://www.capterra.com/p/156310/sciNote-Electronic-Lab-Notebook/)
- [G2 - SciNote 评测](https://www.g2.com/products/scinote/reviews)
- [ELN 竞品比较（splice-bio）](https://splice-bio.com/best-eln-review-for-your-lab/)
- [Top ELN 2025 对比（cotocus）](https://www.cotocus.com/blog/top-10-electronic-lab-notebook-eln-tools-in-2025-features-pros-cons-comparison/)
- [Top ELN 供应商（scispot）](https://www.scispot.com/blog/top-eln-vendors-based-on-real-user-reviews)
- [BioSistemika 公司简介](https://biosistemika.com/about/)
- [SciNote Kickstarter 发布新闻](https://www.bio-itworld.com/pressreleases/2015/11/26/scinote---first-open-source-scientific-notebook-released-on-kickstarter)

---

_报告生成时间：2026-03-04 | 调研工具：WebSearch + WebFetch | 版本：v1.0_
