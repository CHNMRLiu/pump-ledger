# 水泵厂台账管理系统

## 项目目录结构

```
pump-ledger/
├── docker-compose.yml          # Docker Compose 编排文件
├── README.md                   # 项目说明
├── data/                       # SQLite 数据文件（运行时自动生成）
├── backend/                    # 后端 Node.js + Express
│   ├── Dockerfile
│   ├── package.json
│   ├── server.js               # 入口文件
│   ├── db.js                   # 数据库初始化
│   ├── middleware/
│   │   └── auth.js             # JWT 认证中间件
│   └── routes/
│       ├── auth.js             # 登录认证路由
│       ├── users.js            # 用户管理路由
│       ├── dashboard.js        # 看板统计路由
│       ├── crud.js             # 通用 CRUD 路由
│       └── export.js           # Excel 导出路由
└── frontend/                   # 前端 Vue 3 + Element Plus
    ├── Dockerfile
    ├── nginx.conf
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.js             # 入口文件
        ├── App.vue             # 根组件
        ├── api/
        │   └── index.js        # Axios 封装
        ├── router/
        │   └── index.js        # Vue Router
        ├── stores/
        │   └── user.js         # 用户状态管理（Pinia）
        ├── layout/
        │   └── MainLayout.vue  # 主布局（侧边栏+顶栏）
        ├── components/
        │   └── DataTable.vue   # 通用数据表格组件
        └── views/
            ├── Login.vue       # 登录页
            ├── Dashboard.vue   # 看板页
            ├── Contracts.vue   # 合同总表
            ├── ContractDetails.vue  # 合同明细表
            ├── Procurement.vue      # 合同采购登记本
            ├── AdvanceProcurement.vue # 提前采购清单
            ├── Quotations.vue       # 报价管理
            └── Users.vue            # 用户管理
```

## 技术栈

- **前端**: Vue 3 + Vite + Element Plus（中文 UI） + Pinia + Vue Router
- **后端**: Node.js + Express + better-sqlite3
- **认证**: JWT (jsonwebtoken + bcryptjs)
- **导出**: exceljs
- **部署**: Docker Compose (nginx 反代前端 + node 后端)

## 快速启动

### 方式一：Docker Compose（推荐）

```bash
cd pump-ledger
docker compose up -d --build
```

- 前端访问: http://localhost:8080
- 后端 API: http://localhost:3001

### 方式二：本地开发

#### 启动后端

```bash
cd pump-ledger/backend
npm install
node server.js
# 后端运行在 http://localhost:3001
```

#### 启动前端

```bash
cd pump-ledger/frontend
npm install
npm run dev
# 前端运行在 http://localhost:5173，自动代理 /api 到后端
```

## 默认管理员账号

- **用户名**: admin
- **密码**: admin123

## 功能说明

### 数据表

| 表名 | 说明 |
|------|------|
| contracts | 合同总表 |
| contract_details | 合同明细表 |
| procurement_register | 合同采购登记本 |
| advance_procurement | 提前采购清单 |
| quotations | 报价管理 |

### 权限角色

| 角色 | 权限 |
|------|------|
| admin（管理员） | 全部权限，管理用户 |
| purchaser（采购员） | 浏览全部，只能编辑自己的数据 |
| finance（财务） | 浏览全部，编辑发票/收款相关字段 |
| viewer（查看者） | 只读 |

### API 接口

- `POST /api/auth/login` - 登录
- `GET /api/auth/me` - 获取当前用户
- `GET /api/users` - 用户列表（admin）
- `POST/PUT/DELETE /api/users` - 用户管理（admin）
- `GET /api/{table}` - 列表（分页、搜索、筛选）
- `POST /api/{table}` - 新增
- `PUT /api/{table}/:id` - 编辑
- `DELETE /api/{table}/:id` - 删除（admin）
- `GET /api/dashboard` - 看板统计
- `GET /api/{table}/export` - 导出 Excel
- `POST /api/import/{table}` - 批量导入数据（admin）

### 从 Excel 迁移数据

使用导入 API 批量导入：

```bash
curl -X POST http://localhost:3001/api/import/contracts \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '[{"contract_no":"HT-001","contract_name":"测试合同","amount":10000}]'
```

## 设计特点

- 蓝灰色调专业风格
- Element Plus 组件库，中文界面
- 斑马纹表格，hover 高亮
- 响应式布局，支持移动端
- JWT 认证，24小时过期
- 路由守卫，权限控制
- 模糊搜索，后端排序
- Excel 导出，带样式
- 看板统计，CSS 图表
