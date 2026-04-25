# BookCircle — 二手书交易平台

## 项目结构

```
.
├── backend/
│   ├── config/
│   │   └── constants.ts          # 服务器配置
│   ├── db/
│   │   ├── index.ts              # 数据库连接 (Drizzle + postgres.js)
│   │   ├── schema.ts             # 数据库表定义 (Users, Books, Orders, Conversations, Messages, Reviews, Favorites, Reports)
│   │   └── migrations/
│   │       └── 1774087452685_init_bookcircle.sql
│   ├── middleware/
│   │   └── errorHandler.ts
│   ├── repositories/
│   │   ├── books.ts              # 书籍 CRUD + 收藏
│   │   ├── orders.ts             # 订单管理
│   │   ├── messages.ts           # 消息/会话
│   │   ├── reviews.ts            # 评价与信誉
│   │   └── users.ts              # 用户管理
│   ├── routes/
│   │   ├── auth.ts               # 注册/登录/个人资料
│   │   ├── books.ts              # 书籍 API
│   │   ├── orders.ts             # 订单 API
│   │   ├── messages.ts           # 消息 API
│   │   ├── reviews.ts            # 评价 API
│   │   └── upload.ts             # 文件上传
│   └── server.ts             # Express 入口
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── custom/
│       │   │   ├── HomeView.tsx          # 首页 (英雄区/分类/新书/流程/评价/CTA)
│       │   │   ├── BrowseView.tsx        # 浏览搜索 (搜索/筛选/分类/收藏)
│       │   │   ├── BookDetailView.tsx    # 书籍详情 (购买/消息/收藏/举报)
│       │   │   ├── SellView.tsx          # 发布管理 (ISBN扫码/编辑/下架)
│       │   │   ├── OrdersView.tsx        # 订单管理 (买卖双方/状态流转/评价)
│       │   │   ├── MessagesView.tsx      # 聊天系统 (会话列表/实时消息)
│       │   │   ├── ProfileView.tsx       # 个人中心 (资料/评价/收藏)
│       │   │   └── AuthView.tsx          # 登录/注册
│       │   └── ui/                   # shadcn/ui 组件
│       ├── config/
│       │   └── constants.ts          # API_BASE_URL
│       ├── lib/
│       │   └── api.ts                # 所有 API 调用方法
│       └── pages/
│           └── Index.tsx             # 主入口 (导航 + 路由状态)
├── shared/
│   └── types/
│       └── api.ts                # 共享类型 (User, Book, Order, Message, Review, Favorite, Report)
└── drizzle.config.ts
```

## 技术栈

### 后端
- **框架**: Express.js + TypeScript
- **数据库 ORM**: Drizzle ORM + postgres.js
- **认证**: JWT (jsonwebtoken) + bcryptjs
- **数据库**: PostgreSQL

### 前端
- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **样式**: Tailwind CSS V4 (暖色学术主题)
- **UI 组件**: shadcn/ui
- **路由**: React Router DOM (HashRouter)

## 主要功能

1. **用户系统**: 注册/登录/个人资料管理
2. **书籍发布**: ISBN 扫码自动填充、上传照片、成色标注
3. **搜索浏览**: 多维筛选 (分类/成色/价格/排序)
4. **订单交易**: 担保交易流程 (待付款→已付款→已发货→确认收货)
5. **即时消息**: 买卖双方聊天议价
6. **评价信誉**: 交易完成后双向评价、信誉分自动计算
7. **收藏功能**: 收藏感兴趣的书籍
8. **举报机制**: 举报违规书籍/用户

## API 路由

- `POST /api/auth/signup` - 注册
- `POST /api/auth/login` - 登录
- `GET /api/auth/me` - 获取当前用户
- `PUT /api/auth/profile` - 更新资料
- `GET /api/books` - 搜索书籍列表
- `GET /api/books/:id` - 书籍详情
- `POST /api/books` - 发布书籍
- `PUT /api/books/:id` - 编辑书籍
- `DELETE /api/books/:id` - 下架书籍
- `POST /api/books/:id/favorite` - 收藏/取消收藏
- `GET /api/orders` - 订单列表
- `POST /api/orders` - 创建订单
- `PUT /api/orders/:id/status` - 更新订单状态
- `GET /api/messages/conversations` - 会话列表
- `GET /api/messages/:conversationId` - 消息列表
- `POST /api/messages/send` - 发送消息
- `GET /api/reviews/user/:userId` - 用户评价
- `POST /api/reviews` - 提交评价

## 代码生成指南

- 共享类型定义在 `shared/types/api.ts`，前后端均从此导入
- 前端使用 `@shared` 别名导入共享类型
- 所有 API 调用通过 `frontend/src/lib/api.ts` 的 `apiService` 对象
- 导航状态由 `Index.tsx` 的 `currentView` state 管理
- 主题颜色: primary=#2D4A3E, secondary=#C8873A, accent=#E8A84C, background=#F7F3EE
