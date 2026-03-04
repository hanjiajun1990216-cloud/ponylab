# 开源 LIMS/ELN 项目全面调研报告

**调研日期**: 2026-03-04  
**调研范围**: GitHub 及开源社区中所有有价值的 LIMS/ELN 项目  
**用途**: 为 Ponylab 产品设计提供技术参考与借鉴

---

## 一、候选项目概览

| 项目 | Stars | License | 最后活跃 | 技术栈 | 定位 | 推荐度 |
|------|-------|---------|---------|--------|------|-------|
| [eLabFTW](https://github.com/elabftw/elabftw) | 1.3k | AGPL-3.0 | 2026-03（v5.4.3） | PHP + TypeScript + MySQL | 通用ELN | ★★★★★ |
| [SciNote ELN](https://github.com/scinote-eln/scinote-web) | 295 | MPL-2.0 | 2026-02（v1.47.3） | Ruby on Rails + Vue.js + PostgreSQL | 生命科学ELN | ★★★★☆ |
| [MISO LIMS](https://github.com/miso-lims/miso-lims) | 292 | GPL-3.0 | 2026-02（v3.17.0） | Java + JavaScript + MySQL | NGS测序LIMS | ★★★☆☆ |
| [SENAITE Core](https://github.com/senaite/senaite.core) | 334 | GPL-2.0 | 2025-04（v2.6.0） | Python + Plone/Zope + PostgreSQL | 企业级LIMS | ★★★☆☆ |
| [Chemotion ELN](https://github.com/ComPlat/chemotion_ELN) | 173 | AGPL-3.0 | 2026-02（v3.0.0） | Ruby on Rails + React + PostgreSQL | 化学ELN | ★★★☆☆ |
| [OpenSpecimen](https://github.com/krishagni/openspecimen) | 80 | BSD-3 | 活跃中 | Java Spring + Vue.js + MySQL/Oracle | 生物样本库 | ★★★☆☆ |
| [iSkyLIMS](https://github.com/BU-ISCIII/iskylims) | 87 | GPL-3.0 | 2024-12 | Python + Django + MySQL | NGS测序LIMS | ★★☆☆☆ |
| [Baobab LIMS](https://github.com/BaobabLims/baobab.lims) | 87 | GPL-3.0 | 2022-06 | JavaScript + Python/Plone | 生物样本LIMS | ★★☆☆☆ |
| [Aquarium](https://github.com/aquariumbio/aquarium) | 68 | MIT | 2021-02 | Ruby on Rails + JS | 实验室操作系统 | ★★☆☆☆ |
| [OpenELIS Global](https://github.com/openelisglobal/openelisglobal-core) | 44 | MPL-2.0 | 已归档（v1.x） | Java | 公共卫生LIMS | ★☆☆☆☆ |
| [Open-LIMS](https://github.com/open-lims/open-lims) | 52 | GPL-3.0 | 已停更 | PHP + MySQL | 通用LIMS | ★☆☆☆☆ |
| LabKey Server | 9（platform repo） | Apache-2.0 | 2026-03 | Java + JavaScript | 数据管理平台 | ★★☆☆☆ |
| openBIS | 社区repos各<10 | 学术免费 | 活跃中 | Java/Groovy + Python | 数据管理平台 | ★★☆☆☆ |

---

## 二、重点项目详细评估

### 2.1 eLabFTW（最高推荐）

**基本信息**
- GitHub: https://github.com/elabftw/elabftw
- Stars: 1,300+ | Forks: 281 | Contributors: 54
- License: **AGPL-3.0**（注意：GPL传染性，使用需谨慎）
- 最新版本: 5.4.3（2026年3月）
- 定位: "最流行的开源电子实验室笔记本"

**技术栈**
```
Backend:  PHP 8.x + MySQL/MariaDB
Frontend: TypeScript + Twig模板 + Webpack构建
部署:     Docker容器化（单容器）
API:      RESTful JSON API v2（OpenAPI/Swagger文档）
认证:     本地账户 + LDAP + SAML + MFA
```

**架构设计**
- MVC模式，PHP后端 + TypeScript前端
- 核心实体层次结构：
  ```
  AbstractRest
    ├── AbstractEntity
    │   ├── AbstractConcreteEntity
    │   │   ├── Experiments（实验记录）
    │   │   └── Items（物品数据库，如抗体/细胞系）
    │   └── AbstractTemplateEntity
    │       ├── Templates（实验模板）
    │       └── ItemsTypes（物品类型）
  ```
- 权限模型：基于Team的多租户，5层权限评估（base → team → ownership → group → user）
- 文件存储：本地文件系统 + S3兼容存储，含hash校验和软删除
- 前端构建：Webpack分离vendor/app代码，TypeScript类型安全

**数据库关键Schema**
```sql
-- 核心表
users, users2teams, users2team_groups
teams, team_groups
experiments, items, templates, items_types
-- 关联表
comments, uploads, tags2entity
-- 关系表（多种跨实体链接）
```

**部署方式**
- Docker单容器（推荐，最简化）
- 最低512MB RAM，约300MB磁盘

**功能覆盖**
- 实验记录与文档管理
- 资源/物品数据库（可自定义字段）
- 区块链时间戳（可信存证）
- 设备预约日历
- LaTeX/分子编辑器
- REST API（完整CRUD）
- 21种语言支持
- 合规：21 CFR Part 11, FERPA, HIPAA, FISMA

**代码质量评估**
- CI/CD: CircleCI持续集成
- 类型安全：TypeScript前端 + PHP类型声明
- 构建工具：Webpack + Babel + ESLint
- Audit Trail：版本历史可调粒度，管理员操作日志完整
- 社区：bi-monthly会议，Gitter聊天，活跃Issue响应

**优秀实践**
1. 依赖注入：App容器统一管理服务实例
2. 抽象基类：AbstractEntity使实体类型扩展一致
3. 分层权限：顺序评估，写权限蕴含读权限
4. 多租户：基于Team的隔离，支持大型机构
5. 资产优化：Webpack分离vendor/app，缓存友好

**风险提示**
- AGPL-3.0许可证，如果Ponylab作为SaaS对外提供服务，需要开放源码
- PHP技术栈，与主流Python/Node.js生态有差异

---

### 2.2 SciNote ELN（强烈推荐）

**基本信息**
- GitHub: https://github.com/scinote-eln/scinote-web
- Stars: 295 | Forks: 109
- License: **MPL-2.0**（相对宽松，商业友好）
- 最新版本: 1.47.3（2026年2月）
- 开发商: BioSistemika USA

**技术栈**
```
Backend:  Ruby on Rails 7.0 + PostgreSQL
Frontend: Vue.js + JavaScript + SCSS
文件存储: ActiveStorage（支持S3）
认证:     本地密码 + OAuth + SAML
API:      OAuth2 (Doorkeeper) + RESTful
部署:     Docker + docker-compose（含Heroku支持）
```

**数据模型（136个Model文件，最完整的ELN数据模型之一）**
```
核心层次：Teams → Projects → Experiments → Tasks(MyModules)

关键实体：
- Team: 多租户基础单元
- Project/ProjectFolder: 项目和文件夹层次
- Experiment: 实验容器
- MyModule（Task）: 最小工作单元，含协议+结果+库存关联
- Protocol/Step: 协议和步骤（支持版本控制）
- Repository/RepositoryRow/RepositoryColumn: 灵活库存系统
  - 多种值类型：text/date/number/file/list/checklist/status等
- Result：文本/表格/文件三种结果类型
- Form/FormField: 自定义表单系统
- LabelTemplate: 标签打印
- StorageLocation: 存储位置
- Webhook: 外部集成

权限系统：
- UserAssignment + TeamAssignment
- 细粒度权限数组（可自定义角色）
- 从Team向下级联
```

**架构亮点**
- Service Objects抽象复杂业务逻辑
- 多态模型（Polymorphic Models）灵活关联
- 活动跟踪（Activity Tracking）完整审计链
- 全文检索：PostgreSQL + pg_trgm
- 协议版本控制：支持发布/链接/快照

**功能覆盖**
- 完整ELN（实验记录/协议/结果）
- 库存管理（自定义列类型 + 库存扣减警报）
- 标签打印
- 报告生成
- Webhook集成
- 设备管理（connected_device）
- WOPI（Office文档集成）

**代码质量评估**
- CI/CD: GitHub Actions（含Gherkin BDD测试）
- 测试框架: RSpec + Cucumber
- 14k+总commits，活跃社区
- 双分支开发（master稳定 + develop）

**优秀实践**
1. 协议版本控制机制（发布→链接→快照）
2. 灵活库存系统（多列类型EAV模式）
3. 层次化组织模型（Team→Project→Experiment→Task）
4. 多态关联实现统一活动日志
5. OAuth2 API认证（Doorkeeper）

**风险提示**
- Ruby on Rails技术栈，与Python/Node.js生态有差异
- MPL-2.0相对友好，但修改MPL文件需开源该文件

---

### 2.3 SENAITE LIMS（分析测试实验室参考）

**基本信息**
- GitHub: https://github.com/senaite/senaite.core
- Stars: 334 | Forks: 181
- License: **GPL-2.0**（强传染性，商业使用谨慎）
- 最新版本: 2.6.0（2025年4月）
- 定位: 企业级分析测试LIMS（医疗/食品/环境检测）

**技术栈**
```
Backend:  Python + Plone CMS + Zope
Frontend: JavaScript (React + Backbone + Angular) + Bootstrap
数据库:   ZODB（Zope对象数据库）+ PostgreSQL关系存储
部署:     buildout / Docker
API:      RESTful JSON API（plone.restapi）
```

**架构设计（四层架构）**
1. **基础设施层**: Plone/Zope基础、setuptools
2. **内容管理层**: Dexterity内容类型、多目录系统
3. **API集成层**: 工作流系统、AJAX端点
4. **用户界面层**: Browser Views、表单组件

**关键设计：多目录系统（Multi-Catalog）**
```
8个专项目录，取代Plone默认portal_catalog：
- ANALYSIS_CATALOG（分析、复测、参考样品）
- SAMPLE_CATALOG（分析请求/样品）
- SETUP_CATALOG（配置对象）
- CLIENT_CATALOG（客户管理）
- CONTACT_CATALOG（联系人）
- WORKSHEET_CATALOG（工作表）
- AUDITLOG_CATALOG（变更追踪）
- LABEL_CATALOG（标签系统）
```

**核心内容类型**
```
Setup Types: Department, AnalysisProfile, SampleMatrix,
             SampleCondition, SamplePreservation
Sample Types: SampleType, SamplePoint, SampleTemplate, ContainerType
Organization: Manufacturer, Supplier, StorageLocation, InstrumentType
```

**工作流系统（Plone Workflow）**
- 状态机驱动分析和样品工作流
- Workflow Guards（转换验证+权限检查）
- Event Handlers（objectmodified.py订阅者）
- 完整历史保存

**优秀实践**
1. 多目录分域检索（按域专项索引，性能优异）
2. 接口组合（Marker Interface + Behavior）动态能力分配
3. 适配器模式（Zope Component Architecture）插拔行为
4. 事件系统（Publisher/Subscriber）响应式编程
5. 插件化模块设计（37个独立add-on repos）

**风险提示**
- GPL-2.0，传染性强，不适合商业闭源产品
- Plone/Zope栈学习曲线陡峭，招聘困难
- 偏向合规检测实验室，通用性有限

---

### 2.4 Chemotion ELN（化学专项参考）

**基本信息**
- GitHub: https://github.com/ComPlat/chemotion_ELN
- Stars: 173 | Forks: 66 | Commits: 6,233
- License: **AGPL-3.0**
- 最新版本: 3.0.0（2026年2月）
- 资助方: 德国DFG / NFDI4Chem

**技术栈**
```
Backend:  Ruby on Rails + Grape API + PostgreSQL + RDKit扩展
Frontend: React 17 + Alt.js（Flux模式）
化学服务: ChemSpectra / NMRium / Ketcher / OpenBabel / PubChem API
任务队列: Delayed Job
文件存储: Shrine
全文检索: PgSearch（PostgreSQL FTS）
```

**化学专项功能**
- Ketcher分子编辑器（支持有机/金属有机/固相合成）
- ChemSpectra：NMR/MS/IR谱图分析（自动峰值检测）
- NMRium：交互式NMR分析
- OpenBabel：格式转换和属性计算
- 结构搜索：指纹相似度 + 子结构搜索
- PubChem/SciFinder外部数据源集成
- 分子性质计算（分子量/精确质量等）

**数据模型**
```
Collection（组织容器，层次结构）
  ├── Sample（化学样品，含分子结构）
  ├── Reaction（反应，含原料/产物/条件）
  ├── Wellplate（孔板实验）
  └── ResearchPlan（研究计划）

Molecule（结构 + 外部数据）
Container（层次文件/数据组织）
Attachment（文件，含元数据）
```

**API设计**
- Grape框架RESTful API
- 会话 + JWT token双认证
- 集合权限继承机制
- 附件状态机（AASM）管理处理工作流
- 大文件分块上传

**优秀实践**
1. 化学服务微服务化（ChemSpectra独立服务）
2. 状态机驱动文件处理（Upload→Convert→Detect→Visualize）
3. 权限从Collection向下级联继承
4. Delayed Job异步处理重计算任务
5. RDKit PostgreSQL扩展（化学数据库查询）

**风险提示**
- AGPL-3.0许可证，SaaS场景需开放源码
- 高度化学领域专用，通用性有限
- DFG资助项目，若资金断裂可能活跃度下降

---

### 2.5 OpenSpecimen（生物样本库参考）

**基本信息**
- GitHub: https://github.com/krishagni/openspecimen
- Stars: 80 | Forks: 54 | Commits: 25,767
- License: **BSD-3**（商业友好）
- 定位: 生物样本库/生物储存库LIMS
- 使用方: 100+机构（Johns Hopkins, Oxford, Cambridge等）

**技术栈**
```
Backend:  Java Spring Framework 5.3.26
ORM:      Hibernate + Envers（审计）
前端新:   Vue.js 3.x（迁移中）
前端旧:   Angular.js 1.x
数据库:   MySQL / Oracle
Schema迁移: Liquibase 4.8.0
构建工具: Gradle
```

**分层架构**
```
Presentation Layer (Vue.js / Angular.js)
    ↓
API Layer (REST Controllers)
    ↓
Service Layer (Spring Services, @PlusTransactional)
    ↓
Domain Layer (Hibernate Entities)
    ↓
Data Access Layer (DAO via DaoFactory)
    ↓
Database (MySQL / Oracle)
```

**核心领域模型**
```
CollectionProtocol（研究方案，定义标准操作程序）
  ├── CollectionProtocolEvent（时间点，如基线/随访）
  └── CollectionProtocolRegistration（参与者注册）
        ├── Participant（捐献者，含人口统计学数据）
        └── Visit（采集事件）
              └── Specimen（样品，NEW→DERIVED→ALIQUOT层次）
                    └── StorageContainer（层次存储，位置追踪）
```

**关键设计**
- **AQL（Advanced Query Language）**: 自定义查询语言用于样品查询
- **动态表单系统**: 无需改代码添加自定义字段
- **Liquibase Schema版本管理**: 主changelogs路由到安装/升级分支
- **事件驱动**: 样品操作触发审计/集成/工作流事件
- **角色权限**: RBAC在CP-机构对层面执行

**优秀实践**
1. Liquibase数据库版本管理（生产级最佳实践）
2. Factory模式封装实体创建和验证
3. 事件发布后持久化（审计+集成解耦）
4. @PlusTransactional统一事务管理
5. 渐进式前端迁移（Angular→Vue，共存期API驱动）

**风险提示**
- BSD-3商业友好，但企业版功能收费
- 高度生物样本库专用，通用性有限
- Java/Spring栈与现代轻量化趋势有距离

---

### 2.6 MISO LIMS（测序中心参考）

**基本信息**
- GitHub: https://github.com/miso-lims/miso-lims
- Stars: 292 | Forks: 125 | Commits: 5,266
- License: **GPL-3.0**
- 维护方: 安大略癌症研究院 + Earlham研究院

**技术栈**
```
Backend:  Java 59.8% + JavaScript 39.5%
数据库:   MySQL（JNDI连接）
部署:     Docker Compose
文档:     ReadTheDocs + 交互式教程
```

**核心工作流**
```
Sample → Library → Library Aliquot → Pool → Run → Analysis
（支持两种模式：Plain Sample Mode / Detailed Sample Mode）
```

**架构组件**
- miso-service（核心服务）
- sqlstore（数据访问层）
- miso-web（Web界面）
- miso-dto（数据传输对象）
- Pinery-MISO兼容层

**优秀实践**
1. 严格的样品层次结构（Sample→Library→Aliquot→Pool）
2. 双模式支持（简化/详细，按需切换）
3. Pinery兼容层（API标准化，支持多LIMS集成）

**风险提示**
- GPL-3.0，传染性强
- 高度测序中心专用，通用性有限
- Java栈

---

### 2.7 openBIS（数据管理平台参考）

**基本信息**
- 开发方: ETH Zurich Scientific IT Services
- License: 学术免费，商业需授权协议
- 定位: ELN+LIMS+数据管理三合一平台
- 技术栈: Java/Groovy + Python API (PyBIS)

**核心模块**
- ELN模块（实验记录）
- LIMS模块（材料和方法管理）
- 数据管理模块（原始数据/分析脚本）
- BigDataLink（Git-like大数据集链接工具）
- Jupyter Notebook集成

**特点**
- FAIR数据原则合规
- 开放插件API（支持自定义插件开发）
- 审计追踪（Audit Trail）
- 用户权限管理
- Excel导入导出

**风险提示**
- 商业使用需联系ETH签授权协议
- GitHub社区repos均为周边工具（<10 stars），主代码托管在ETH内部
- 部署复杂度高

---

### 2.8 LabKey Server（大型研究数据管理参考）

**基本信息**
- GitHub: https://github.com/LabKey/platform（9 stars）
- License: Apache-2.0（商业友好）
- 定位: 大型科学数据集成和管理平台
- License: Apache-2.0

**技术栈**
```
Backend:  Java（46.3%）
Frontend: JavaScript（45.6%）+ CSS
架构:     插件化Java模块系统
构建:     Gradle
```

**核心模块**
- core/api（核心基础）
- query/list/study/specimen（数据管理）
- assay/experiment/survey（科学工作流）
- audit/issues/wiki（管理工具）
- visualization/search（数据分析）

**特点**
- 大型临床研究联盟（HIV研究网络）验证
- 三季度发布周期（成熟稳定）
- 样品管理+检测数据集成+报告

**风险提示**
- 社区热度极低（platform 9 stars），商业支持主导
- 企业版功能更全，开源版可能有限制
- Java/重型平台，不适合快速迭代

---

## 三、其他值得关注的项目

### 3.1 Aquarium（协议驱动实验室操作系统）
- **GitHub**: https://github.com/aquariumbio/aquarium（68 stars，MIT）
- **技术栈**: Ruby on Rails + Krill DSL
- **独特点**: 用DSL编写可执行协议，支持touchscreen指导，完整日志记录
- **状态**: 2021年后无大版本更新，最后版本2.9.0
- **借鉴价值**: 协议执行的可重现性设计

### 3.2 iSkyLIMS（NGS专项）
- **GitHub**: https://github.com/BU-ISCIII/iskylims（87 stars，GPL-3.0）
- **技术栈**: Python + Django 4.2 + Bootstrap 5 + MySQL
- **定位**: 专为Illumina测序设备（NextSeq/MiSeq）设计
- **状态**: 2024年12月最后提交

### 3.3 OpenELIS Global v2（公共卫生LIMS）
- **GitHub**: https://github.com/DIGI-UW/OpenELIS-Global-2
- **技术栈**: React + Spring Boot + Docker
- **License**: MPL-2.0
- **用途**: 26+国家公共卫生实验室，HIV/TB检测
- **借鉴价值**: 资源受限环境的LIMS设计

### 3.4 NEMO（NIST仪器管理）
- **License**: MIT
- **开发方**: NIST
- **功能**: 实验室资源管理（设备预约/访问控制/维护追踪）
- **借鉴价值**: 设备管理模块设计

---

## 四、关键技术维度横向对比

### 4.1 数据模型设计对比

| 项目 | 组织层次 | 实体抽象 | 自定义字段 | 关联方式 |
|------|---------|---------|-----------|---------|
| SciNote | Team→Project→Experiment→Task | 细粒度（136 models） | EAV多值类型 | 多态关联 |
| eLabFTW | Team→Experiments/Items | 统一AbstractEntity | 无（结构化固定） | 外键关联 |
| Chemotion | Collection→Sample/Reaction | 化学专项实体 | 有限 | 层次集合 |
| OpenSpecimen | Protocol→Event→Visit→Specimen | 生物样本专项 | 动态表单 | 层次+RBAC |
| SENAITE | Client→Sample→Analysis | 基于Plone对象 | Behavior扩展 | 内容关联 |

### 4.2 API设计对比

| 项目 | API风格 | 认证方式 | 文档工具 | 版本管理 |
|------|---------|---------|---------|---------|
| eLabFTW | RESTful v2 | API Key Token | OpenAPI/Swagger | URL版本（/api/v2） |
| SciNote | RESTful | OAuth2（Doorkeeper） | 无公开Swagger | 无明确版本 |
| Chemotion | RESTful（Grape） | Session + JWT | Grape自动 | 无 |
| OpenSpecimen | 100% REST | Session | 官方文档 | 无 |
| SENAITE | RESTful（plone.restapi） | Session | Plone标准 | 路径版本 |

### 4.3 权限模型对比

| 项目 | 模型类型 | 粒度 | 多租户 | 特点 |
|------|---------|------|--------|------|
| eLabFTW | 5层权限评估 | 实体级 | Team隔离 | 写权限蕴含读权限 |
| SciNote | RBAC + 自定义角色 | 项目级 | Team级联 | 细粒度权限数组 |
| Chemotion | 集合权限继承 | Collection级 | 无明确多租户 | 权限随容器层次继承 |
| OpenSpecimen | RBAC（CP-机构对） | 协议+机构 | 多机构隔离 | AccessCtrlMgr拦截服务 |
| SENAITE | Plone安全策略 | 内容对象级 | Client隔离 | Workflow Guard |

### 4.4 部署方式对比

| 项目 | 首选部署 | 最低配置 | 数据库 | CI/CD |
|------|---------|---------|--------|-------|
| eLabFTW | Docker单容器 | 512MB RAM | MySQL/MariaDB | CircleCI |
| SciNote | Docker Compose | 未明确 | PostgreSQL | GitHub Actions |
| MISO | Docker Compose | 未明确 | MySQL | 有 |
| OpenSpecimen | Tomcat + DB | 企业级 | MySQL/Oracle | Gradle CI |
| Chemotion | Docker Compose | 未明确 | PostgreSQL | 有 |

### 4.5 测试质量对比

| 项目 | 测试框架 | 覆盖率 | BDD | E2E |
|------|---------|------|-----|-----|
| eLabFTW | PHPUnit + Cypress | 中等 | 否 | 是 |
| SciNote | RSpec + Cucumber | 较高 | 是（Gherkin） | 是 |
| Chemotion | RSpec | 中等 | 否 | 否 |
| MISO | JUnit + Spring Test | 中等 | 否 | 否 |
| OpenSpecimen | JUnit | 中等 | 否 | 否 |

---

## 五、许可证风险评估

| License | 项目 | 商业风险 | 说明 |
|---------|------|---------|------|
| **AGPL-3.0** | eLabFTW, Chemotion | 高风险 | SaaS提供服务需开放源码 |
| **GPL-2.0** | SENAITE | 高风险 | 衍生作品必须GPL开源 |
| **GPL-3.0** | MISO, iSkyLIMS, Open-LIMS | 高风险 | 同上，且v3更严格 |
| **MPL-2.0** | SciNote, OpenELIS | 中风险 | 仅修改的MPL文件需开源，整体可闭源 |
| **BSD-3** | OpenSpecimen | 低风险 | 保留版权声明即可商用 |
| **Apache-2.0** | LabKey | 低风险 | 商业友好，需保留NOTICE |
| **MIT** | Aquarium | 最低风险 | 几乎无限制 |

**Ponylab的推荐选择**：  
- 直接借鉴代码 → 优先MPL-2.0、BSD-3、Apache-2.0、MIT项目
- 仅借鉴设计思路（不复制代码）→ 无限制

---

## 六、Ponylab 技术借鉴清单

以下按优先级排列，标注"**直接借鉴**"（设计思路）和"**代码参考**"（代码架构参考）。

### 6.1 数据模型设计（最高优先级）

**来源：SciNote ELN**  
借鉴：**Team → Project → Experiment → Task 四层层次模型**
- 团队作为多租户基础单元
- 项目和实验提供双层分组
- Task（最小工作单元）关联协议+结果+库存
- 直接借鉴，代码参考SciNote的`my_module.rb`/`experiment.rb`/`project.rb`

**来源：SciNote ELN**  
借鉴：**EAV模式的灵活库存系统**
- RepositoryColumn（列定义）+ RepositoryCell（值）
- 支持text/date/number/file/list/status等多种值类型
- 库存扣减警报机制
- 直接借鉴，这是实验室库存管理的标准最佳实践

**来源：OpenSpecimen**  
借鉴：**动态表单系统**
- 无需改代码即可添加自定义数据字段
- 通过数据库存储表单定义和值
- 适合Ponylab支持不同实验室的定制化需求

### 6.2 协议版本控制（高优先级）

**来源：SciNote ELN**  
借鉴：**协议版本控制机制（草稿→发布→链接→快照）**
- 协议可在库中独立存在（模板）
- 任务中使用协议时生成链接快照
- 版本变更时可选择更新链接或保留旧版本
- 这是ELN中极重要的数据完整性保障

### 6.3 权限和多租户设计（高优先级）

**来源：eLabFTW**  
借鉴：**5层权限评估模型**
```
base → team membership → ownership → team group → individual user
```
- 写权限蕴含读权限（简化逻辑）
- 团队内群组（Team Group）精细化控制
- 适合多实验室SaaS场景

**来源：SciNote ELN**  
借鉴：**细粒度权限数组 + 自定义角色**
- 权限存储为数组，支持细粒度组合
- 角色可自定义（非固定三级）
- 从Team向下级联继承

### 6.4 API 设计（高优先级）

**来源：eLabFTW**  
借鉴：**OpenAPI/Swagger文档化的REST API v2**
- URL版本管理（/api/v2/）
- API Key Token认证（简单易用）
- 完整CRUD + 过滤 + 分页
- OpenAPI规范文档（自动生成SDK）

**来源：SciNote ELN**  
借鉴：**OAuth2 + Doorkeeper的API认证**
- 标准OAuth2 Bearer Token
- 支持第三方应用集成
- 适合Ponylab开放API生态

**来源：Chemotion ELN**  
借鉴：**Grape API框架的模块化设计**
- 每个域独立API模块（Collection/Sample/Reaction等）
- 统一认证中间件
- Grape自动生成文档
- 结构化错误处理

### 6.5 审计追踪（高优先级）

**来源：eLabFTW + OpenSpecimen**  
借鉴：**不可篡改的操作日志**
- 所有实体变更自动记录
- 管理员操作单独日志表（users2logs）
- 版本历史可调粒度
- 事件驱动审计（持久化后发布事件，解耦审计逻辑）

### 6.6 数据库Schema管理（中优先级）

**来源：OpenSpecimen**  
借鉴：**Liquibase数据库版本管理**
- 主changelog路由安装/升级分支
- 版本目录含DDL+seed data+migration
- 应用启动自动执行schema更新
- 这是生产级LIMS的必备实践

**来源：SciNote ELN**  
借鉴：**PostgreSQL + pg_trgm 全文检索**
- ActiveRecord + PostgreSQL原生FTS
- trigram索引支持模糊搜索
- 避免引入Elasticsearch的复杂性

### 6.7 文件存储设计（中优先级）

**来源：eLabFTW**  
借鉴：**多后端文件存储（本地 + S3兼容）**
- 抽象存储后端接口
- 文件Hash校验（数据完整性）
- 软删除（可恢复）
- 自动缩略图生成

**来源：Chemotion ELN**  
借鉴：**Shrine文件存储 + 状态机处理**
- Shrine支持多存储后端
- AASM状态机管理文件处理工作流（上传→转换→分析→可视化）
- 分块上传支持大文件

### 6.8 工作流引擎（中优先级）

**来源：SENAITE LIMS**  
借鉴：**样品生命周期状态机设计**
- 明确定义的状态（received/scheduled/to_be_verified等）
- 状态转换Guard（权限+业务逻辑验证）
- Workflow历史保存（完整轨迹）
- 状态驱动UI变化

**来源：OpenSpecimen**  
借鉴：**工厂模式（Factory Pattern）封装实体创建**
- Factory封装创建+验证逻辑
- 避免Controller直接操作Domain
- 适合复杂业务规则的样品管理

### 6.9 前端架构（中优先级）

**来源：eLabFTW**  
借鉴：**TypeScript + Webpack模块化前端**
- TypeScript类型安全
- Webpack分离vendor/app（长缓存友好）
- Twig模板 + TypeScript模块的清晰分工
- 按页面职责拆分JS模块（edit/view/show）

**来源：SciNote + OpenSpecimen**  
借鉴：**Vue.js + API驱动的渐进式前端**
- Vue.js组件化
- 与后端解耦（纯API通信）
- 支持局部渐进替换旧界面

### 6.10 部署和运维（中优先级）

**来源：eLabFTW**  
借鉴：**单容器Docker极简部署**
- 单docker-compose.yml一键启动
- 最低512MB RAM门槛
- 适合小型实验室自部署

**来源：SciNote**  
借鉴：**多环境Docker配置**
- Dockerfile.development / Dockerfile.production分离
- CI/CD集成测试
- Heroku支持（PaaS友好）

### 6.11 化学/生物专项功能（根据Ponylab定位选择）

**来源：Chemotion ELN**（如Ponylab服务化学实验室）
- 分子编辑器集成（Ketcher，MIT许可）
- 谱图分析微服务化（ChemSpectra独立部署）
- RDKit PostgreSQL扩展（结构搜索）

**来源：OpenSpecimen**（如Ponylab服务生物样本库）
- 层次样品模型（NEW→DERIVED→ALIQUOT）
- 条码打印集成（Zebra/Brady）
- 存储容器层次（StorageContainer + 位置追踪）

---

## 七、不推荐理由（排除项目）

| 项目 | 排除原因 |
|------|---------|
| **Open-LIMS** | PHP旧栈，2010年代后停止更新，社区归档状态 |
| **Baobab LIMS** | 2022年后无提交，Plone栈，生物样本库专用，活跃度不足 |
| **OpenELIS v1.x** | 明确标注EOL（End of Life），已指引迁移到v2 |
| **HalX LIMS** | 晶体学专用，已停止开发 |
| **C4G BLIS** | 2016年后开发停滞 |
| **Aquarium** | 2021年后无大版本，小众（68 stars），Krill DSL学习成本高 |
| **LabKey Server** | 企业商业为主（platform仅9 stars），开源版功能受限，Java重型 |
| **openBIS** | 商业授权需ETH协议，主代码非GitHub托管，部署复杂 |

---

## 八、综合推荐与实施建议

### 对 Ponylab 的核心建议

**首先学习研究（优先级排序）**：
1. **SciNote ELN**（MPL-2.0）：最值得深入分析的完整ELN实现，数据模型最成熟
2. **eLabFTW**（AGPL-3.0，仅学习设计不复制代码）：API设计和权限模型的最佳参考
3. **OpenSpecimen**（BSD-3）：可参考代码，生物样本管理和动态表单的绝佳参考
4. **Chemotion ELN**（AGPL-3.0，仅学习设计）：如服务化学实验室，化学功能设计参考

**Ponylab应该自主实现的核心系统**（不要直接fork，因许可证或架构不匹配）：
- 核心数据模型（参考SciNote层次结构，但用自选技术栈实现）
- 权限和多租户（参考eLabFTW五层模型）
- REST API（参考eLabFTW OpenAPI设计，使用OpenAPI优先）
- 工作流引擎（参考SENAITE的Plone Workflow思路）

**可以直接使用或集成的开源组件**：
- Ketcher分子编辑器（MIT许可，可直接嵌入）
- Liquibase数据库迁移（Apache-2.0）
- PostgreSQL pg_trgm全文检索（PostgreSQL许可）

### 技术选型建议（基于调研结论）

| 组件 | 建议选择 | 参考来源 |
|------|---------|---------|
| 后端框架 | FastAPI/Django（Python）或 Next.js（Node） | 非LIMS领域主流，避开重型Java和Ruby |
| 数据库 | PostgreSQL + pg_trgm | SciNote, Chemotion |
| Schema迁移 | Alembic（Python）/ Prisma（Node）/ Liquibase | OpenSpecimen最佳实践 |
| 文件存储 | 本地 + S3抽象接口 | eLabFTW Uploads模式 |
| API规范 | OpenAPI 3.0（Swagger文档优先） | eLabFTW API |
| 认证 | OAuth2 + JWT | SciNote Doorkeeper |
| 前端 | Vue.js 3 or React | SciNote(Vue) / Chemotion(React) |
| 容器化 | Docker Compose（单文件入门）| eLabFTW模式 |
| 任务队列 | Celery（Python）/ BullMQ（Node） | Chemotion Delayed Job思路 |

---

## 九、调研局限性说明

1. **Star数据时效性**：数据采集于2026年3月，各项目Star数可能已有变动
2. **商业版差异**：OpenSpecimen等项目存在商业版功能差异，本报告仅评估开源版
3. **代码质量深度**：部分项目通过DeepWiki分析，未逐行审查代码
4. **性能数据缺失**：未进行实际性能基准测试
5. **许可证建议**：许可证分析基于一般解读，正式商业使用前应咨询法律顾问

---

**报告完成时间**: 2026-03-04  
**调研工具**: GitHub WebFetch, DeepWiki API Analysis, IntuitionLabs指南  
**下一步**: 建议深入clone SciNote + eLabFTW代码库，针对Ponylab核心功能进行详细设计对比
