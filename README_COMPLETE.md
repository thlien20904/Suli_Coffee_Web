# ☕ SULI COFFEE WEB - HỆ THỐNG QUẢN LÝ QUÁN CÀ PHÊ TRỰC TUYẾN

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)
![React](https://img.shields.io/badge/react-18.3.1-61dafb.svg)
![License](https://img.shields.io/badge/license-ISC-yellow.svg)

## 📋 MỤC LỤC

1. [Tổng quan dự án](#-tổng-quan-dự-án)
2. [Ý tưởng và Mục tiêu](#-ý-tưởng-và-mục-tiêu)
3. [Kiến trúc hệ thống](#️-kiến-trúc-hệ-thống)
4. [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
5. [Cấu trúc dự án](#-cấu-trúc-dự-án)
6. [Cơ sở dữ liệu](#️-cơ-sở-dữ-liệu)
7. [Tính năng chi tiết](#-tính-năng-chi-tiết)
8. [Luồng hoạt động](#-luồng-hoạt-động)
9. [Giải quyết vấn đề](#-giải-quyết-vấn-đề)
10. [Bugs & Solutions](#-bugs--solutions)
11. [Phương pháp AI](#-phương-pháp-ai--chatbot)
12. [API Endpoints](#-api-endpoints)
13. [Cài đặt và triển khai](#-cài-đặt-và-triển-khai)
14. [Bảo mật](#-bảo-mật)
15. [Tối ưu hóa](#-tối-ưu-hóa)

---

## 🎯 TỔNG QUAN DỰ ÁN

**SuLi Coffee Web** là hệ thống quản lý quán cà phê trực tuyến toàn diện, được phát triển với kiến trúc **Client-Server** hiện đại, hỗ trợ đặt hàng online, thanh toán điện tử, quản lý kho, và giao hàng tích hợp.

### ✨ Điểm nổi bật

- 🔄 **Real-time Updates**: Socket.IO cho cập nhật trạng thái đơn hàng tức thì
- 💳 **Thanh toán đa kênh**: VNPay QR Code, COD, Chuyển khoản
- 🚚 **Tích hợp Giao Hàng Nhanh (GHN)**: Tự động tạo đơn vận chuyển và tracking
- 🔐 **OAuth 2.0**: Đăng nhập Google an toàn
- 🛡️ **Content Security Policy**: Bảo mật web cao cấp
- 🤖 **AI Chatbot**: Hỗ trợ khách hàng tự động
- 📱 **Responsive Design**: Tối ưu cho mọi thiết bị
- 🗄️ **PostgreSQL + Supabase**: Database cloud hiệu năng cao

---

## 💡 Ý TƯỞNG VÀ MỤC TIÊU

### 🎯 Bối cảnh và Động lực

**Vấn đề thực tế:**
- Các quán cà phê truyền thống gặp khó khăn trong việc quản lý đơn hàng online
- Khách hàng phải gọi điện hoặc nhắn tin để đặt hàng, dễ nhầm lẫn
- Không có hệ thống theo dõi đơn hàng real-time
- Thanh toán chủ yếu bằng tiền mặt, không thuận tiện
- Quản lý kho và báo cáo doanh thu thủ công, tốn thời gian

**Ý tưởng giải quyết:**
Xây dựng một **hệ thống quản lý quán cà phê trực tuyến toàn diện** với:
- ☕ **Trải nghiệm khách hàng tốt**: Duyệt menu, đặt hàng online dễ dàng
- 💳 **Thanh toán đa dạng**: VNPay QR, COD, chuyển khoản
- 🔔 **Cập nhật real-time**: Socket.IO cho thông báo tức thì
- 🚚 **Tích hợp giao hàng**: API Giao Hàng Nhanh (GHN) tự động
- 📊 **Quản lý thông minh**: Dashboard admin với báo cáo chi tiết
- 🤖 **Hỗ trợ AI**: Chatbot tư vấn sản phẩm

### 🎯 Mục tiêu dự án

**1. Mục tiêu chính:**
- ✅ Tạo nền tảng e-commerce chuyên biệt cho ngành cà phê
- ✅ Tự động hóa quy trình đặt hàng và thanh toán
- ✅ Cung cấp trải nghiệm mượt mà trên mọi thiết bị
- ✅ Tích hợp các dịch vụ bên thứ ba (VNPay, GHN, Google)
- ✅ Đảm bảo bảo mật cao với CSP và OAuth 2.0

**2. Mục tiêu kỹ thuật:**
- 🏗️ **Kiến trúc scalable**: Microservices-ready architecture
- ⚡ **Performance**: Real-time updates với Socket.IO
- 🛡️ **Security-first**: Implement best practices (CSP, JWT, BCrypt)
- 📱 **Mobile-first**: Responsive design cho mobile users
- 🔧 **Maintainable**: Clean code, MVC pattern, separation of concerns

**3. Mục tiêu người dùng:**

| Đối tượng | Nhu cầu | Giải pháp |
|-----------|---------|-----------|
| **Khách hàng** | Đặt đồ uống nhanh chóng | UI thân thiện, checkout 1 click |
| **Chủ quán** | Quản lý đơn hàng hiệu quả | Dashboard real-time, báo cáo tự động |
| **Nhân viên** | Xử lý đơn hàng dễ dàng | Workflow rõ ràng, thông báo tức thì |
| **Shipper** | Nhận thông tin giao hàng | Tích hợp GHN, tracking tự động |

### 🌟 Tính độc đáo của dự án

1. **Real-time Everything**: Socket.IO cho cập nhật tức thì (không cần refresh)
2. **Auto Shipping Integration**: Tự động tạo đơn GHN, tính phí ship theo khoảng cách
3. **Smart Cart**: Giỏ hàng lưu database, đồng bộ multi-device
4. **Pending Orders**: Lưu đơn nháp, tự động hủy sau 30 phút
5. **Content Security Policy**: Bảo mật web cấp enterprise
6. **AI Chatbot**: Tư vấn sản phẩm context-aware
7. **Timezone Handling**: UTC storage, frontend conversion cho multi-region

---

## 🏗️ KIẾN TRÚC HỆ THỐNG

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│  React 18 + Redux Toolkit + Socket.IO Client                   │
│  - User Interface (Product List, Cart, Checkout)               │
│  - Admin Dashboard (Orders, Inventory, Reports)                │
│  - Real-time Notifications                                     │
└──────────────────┬──────────────────────────────────────────────┘
                   │ HTTPS/WSS
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                          │
├─────────────────────────────────────────────────────────────────┤
│  Express.js 5 + Socket.IO Server                               │
│  - RESTful API Endpoints                                       │
│  - WebSocket Real-time Communication                           │
│  - Authentication & Authorization (JWT)                        │
│  - Business Logic & Validation                                 │
└──────────────────┬──────────────────────────────────────────────┘
                   │
       ┌───────────┼───────────┐
       ▼           ▼           ▼
┌──────────┐ ┌──────────┐ ┌──────────┐
│ Database │ │ External │ │  Cloud   │
│  Layer   │ │   APIs   │ │ Services │
├──────────┤ ├──────────┤ ├──────────┤
│PostgreSQL│ │  VNPay   │ │ Supabase │
│ Sequelize│ │   GHN    │ │Cloudflare│
│   ORM    │ │  Google  │ │  Vercel  │
└──────────┘ └──────────┘ └──────────┘
```

### Kiến trúc phân tầng

1. **Presentation Layer (Frontend)**
   - React components với responsive design
   - Redux store cho state management
   - Socket.IO client cho real-time updates

2. **Application Layer (Backend)**
   - Express.js middleware pipeline
   - JWT authentication
   - Socket.IO event handlers
   - Business logic controllers

3. **Data Access Layer**
   - Sequelize ORM
   - Database models & associations
   - Query optimization

4. **Integration Layer**
   - VNPay payment gateway
   - GHN shipping API
   - Google OAuth 2.0
   - SendGrid email service

---

## 💻 CÔNG NGHỆ SỬ DỤNG

### Frontend Stack

| Công nghệ | Version | Mục đích |
|-----------|---------|----------|
| **React** | 18.3.1 | UI framework chính |
| **Redux Toolkit** | 2.9.0 | State management |
| **React Router** | 6.30.1 | Client-side routing |
| **Socket.IO Client** | 4.8.1 | Real-time communication |
| **Axios** | 1.12.2 | HTTP client |
| **Bootstrap** | 5.3.8 | UI components |
| **Chart.js** | 4.5.0 | Data visualization |
| **SweetAlert2** | 11.23.0 | Beautiful alerts |
| **Google Maps API** | 2.20.7 | Location services |
| **JWT Decode** | 4.0.0 | Token parsing |

### Backend Stack

| Công nghệ | Version | Mục đích |
|-----------|---------|----------|
| **Node.js** | ≥16.0.0 | Runtime environment |
| **Express.js** | 5.1.0 | Web framework |
| **Sequelize** | 6.37.7 | ORM |
| **PostgreSQL** | 8.16.3 | Database |
| **Socket.IO** | 4.8.1 | WebSocket server |
| **Passport.js** | 0.7.0 | Authentication |
| **JWT** | 9.0.2 | Token-based auth |
| **BCrypt** | 3.0.2 | Password hashing |
| **Multer** | 2.0.2 | File upload |
| **VNPay SDK** | 2.4.4 | Payment integration |
| **Nodemailer** | 7.0.6 | Email service |
| **ExcelJS** | 4.4.0 | Report generation |

### DevOps & Infrastructure

- **Supabase**: PostgreSQL hosting + Storage
- **Cloudflare Pages**: Frontend hosting
- **Vercel**: Alternative deployment
- **Git**: Version control
- **Nodemon**: Development hot reload

---

## 📁 CẤU TRÚC DỰ ÁN

```
SuLi/
│
├── backend/                          # Backend Node.js/Express
│   ├── config/                       # Cấu hình
│   │   ├── config.js                 # Database config
│   │   ├── db.js                     # MSSQL connection (legacy)
│   │   ├── sequelize.js              # PostgreSQL + Sequelize
│   │   └── middlewareSetup.js        # Middleware configuration
│   │
│   ├── controllers/                  # Business logic
│   │   ├── admin/                    # Admin controllers
│   │   │   ├── categoryController.js
│   │   │   ├── foodController.js
│   │   │   ├── ingredientController.js
│   │   │   ├── invoiceController.js
│   │   │   ├── orderController.js
│   │   │   ├── reportController.js
│   │   │   ├── staffController.js
│   │   │   ├── userController.js
│   │   │   └── voucherController.js
│   │   │
│   │   ├── user/                     # User controllers
│   │   │   ├── auth/                 # Authentication
│   │   │   │   ├── signin.js
│   │   │   │   └── signup.js
│   │   │   ├── orders/               # Order management
│   │   │   │   ├── config.js         # Shared config
│   │   │   │   ├── prepareOrder.js   # Pre-order validation
│   │   │   │   ├── placeOrder.js     # Order placement
│   │   │   │   ├── pending.js        # Draft orders
│   │   │   │   └── order.js          # Order CRUD
│   │   │   ├── profile/              # User profile
│   │   │   │   ├── info.js
│   │   │   │   ├── order.js
│   │   │   │   └── notifications.js
│   │   │   ├── cart.js               # Shopping cart
│   │   │   ├── products.js           # Product browsing
│   │   │   └── address.js            # Delivery addresses
│   │   │
│   │   └── webhooks/                 # External webhooks
│   │       ├── ghnWebhook.js         # GHN delivery updates
│   │       └── vnpayWebhook.js       # VNPay payment callbacks
│   │
│   ├── models/                       # Sequelize models
│   │   ├── init-models.js            # Model initialization
│   │   ├── Users.js                  # Users table
│   │   ├── Orders.js                 # Orders table
│   │   ├── OrderDetails.js           # Order items
│   │   ├── Food.js                   # Products
│   │   ├── Category.js               # Product categories
│   │   ├── GioHang.js                # Shopping cart
│   │   ├── Vouchers.js               # Discount vouchers
│   │   ├── CuaHang.js                # Store locations
│   │   ├── ShippingOrders.js         # GHN shipping orders
│   │   └── ... (31 models total)
│   │
│   ├── routes/                       # API routes
│   │   ├── admin/                    # Admin routes
│   │   │   ├── Food.js               # /api/admin/foods
│   │   │   ├── category.js           # /api/admin/categories
│   │   │   ├── order.js              # /api/admin/orders
│   │   │   ├── invoice.js            # /api/admin/invoice
│   │   │   ├── report.js             # /api/admin/report
│   │   │   └── voucher.js            # /api/admin/voucher
│   │   │
│   │   ├── user/                     # User routes
│   │   │   ├── auth.js               # /api/auth
│   │   │   ├── productsUser.js       # /api/products
│   │   │   ├── cartUser.js           # /api/cart
│   │   │   ├── ordersUser.js         # /api/orders
│   │   │   ├── addressesUser.js      # /api/addresses
│   │   │   └── profile.js            # /api/profile
│   │   │
│   │   ├── shared/                   # Shared routes
│   │   │   └── chatbot.js            # /api/chatbot
│   │   │
│   │   └── webhooks/                 # Webhook endpoints
│   │       └── index.js              # /api/webhooks
│   │
│   ├── services/                     # External services
│   │   ├── ghnService.js             # Giao Hàng Nhanh API
│   │   ├── supabaseService.js        # Supabase storage
│   │   ├── hybridUploadService.js    # File upload handler
│   │   └── chatbotService.js         # AI chatbot logic
│   │
│   ├── utils/                        # Utilities
│   │   ├── realtimeHelper.js         # Socket.IO helpers
│   │   ├── logger.js                 # Logging utility
│   │   └── timezone.js               # Timezone handling
│   │
│   ├── public/                       # Static files
│   │   ├── index.html                # CSP demo dashboard
│   │   ├── analyze.html              # Security analysis
│   │   └── images/                   # Public images
│   │
│   ├── uploads/                      # Uploaded files
│   │   ├── images/                   # Product images
│   │   └── video/                    # Video files
│   │
│   ├── logs/                         # Security logs
│   │   ├── passes.json               # CSP passes
│   │   └── violations.json           # CSP violations
│   │
│   ├── cspMiddleware.js              # Content Security Policy
│   ├── clickjackingMiddleware.js     # X-Frame-Options
│   ├── securityHeaders.js            # Security headers
│   ├── socketManager.js              # Socket.IO manager
│   ├── server.js                     # Main server file
│   └── package.json                  # Dependencies
│
├── frontend/                         # Frontend React
│   ├── public/                       # Public assets
│   │   ├── index.html                # HTML template
│   │   ├── images/                   # Static images
│   │   └── _worker.js                # Cloudflare Worker
│   │
│   ├── src/                          # Source code
│   │   ├── components/               # React components
│   │   │   ├── layout/               # Layout components
│   │   │   │   ├── user/
│   │   │   │   │   ├── UserLayout.js
│   │   │   │   │   ├── Header.js
│   │   │   │   │   └── Footer.js
│   │   │   │   └── admin/
│   │   │   │       ├── AdminLayout.js
│   │   │   │       └── Sidebar.js
│   │   │   │
│   │   │   ├── CSP/                  # Security components
│   │   │   │   ├── CSPProvider.js
│   │   │   │   └── CSPDashboard.js
│   │   │   │
│   │   │   ├── ChatBot.js            # AI chatbot widget
│   │   │   └── ... (various shared components)
│   │   │
│   │   ├── pages/                    # Page components
│   │   │   ├── user/                 # User pages
│   │   │   │   ├── Home.js           # Homepage
│   │   │   │   ├── Login.js          # Login page
│   │   │   │   ├── Register.js       # Registration
│   │   │   │   ├── ProductList.js    # Product catalog
│   │   │   │   ├── ProductDetail.js  # Product detail
│   │   │   │   ├── Cart.js           # Shopping cart
│   │   │   │   ├── Checkout.js       # Checkout process
│   │   │   │   ├── successful.js     # Order success
│   │   │   │   ├── VnpayReturn.js    # Payment callback
│   │   │   │   │
│   │   │   │   └── profile/          # User profile
│   │   │   │       ├── Profile.js
│   │   │   │       ├── ProfileInfo.js
│   │   │   │       ├── OrdersList.js
│   │   │   │       ├── OrderDetail.js
│   │   │   │       ├── Vouchers.js
│   │   │   │       └── Notifications.js
│   │   │   │
│   │   │   └── admin/                # Admin pages
│   │   │       ├── AdminDashboard.js # Dashboard
│   │   │       ├── order.js          # Order management
│   │   │       ├── invoice.js        # Invoice list
│   │   │       ├── Food/             # Product management
│   │   │       │   ├── Food.js
│   │   │       │   ├── Add.js
│   │   │       │   └── Edit.js
│   │   │       ├── category/         # Category management
│   │   │       ├── ingredient/       # Ingredient management
│   │   │       ├── staff/            # Staff management
│   │   │       ├── voucher/          # Voucher management
│   │   │       └── report/           # Reports
│   │   │           ├── revenue.js
│   │   │           └── bestseller.js
│   │   │
│   │   ├── redux/                    # Redux store
│   │   │   ├── store.js              # Store configuration
│   │   │   ├── userSlice.js          # User state
│   │   │   └── cartSlice.js          # Cart state
│   │   │
│   │   ├── hooks/                    # Custom hooks
│   │   │   └── useSocket.js          # Socket.IO hook
│   │   │
│   │   ├── utils/                    # Utilities
│   │   │   ├── apiConfig.js          # API configuration
│   │   │   └── realtimeHelper.js     # Socket helpers
│   │   │
│   │   ├── styles/                   # CSS files
│   │   │   ├── components/           # Component styles
│   │   │   └── pages/                # Page styles
│   │   │
│   │   ├── App.js                    # Root component
│   │   ├── index.js                  # Entry point
│   │   └── setupProxy.js             # Dev proxy config
│   │
│   ├── build/                        # Production build
│   ├── server.js                     # Production server
│   ├── socketManager.js              # Socket.IO client
│   ├── cspMiddleware.js              # CSP middleware
│   ├── package.json                  # Dependencies
│   └── vercel.json                   # Vercel config
│
├── public/                           # Shared public files
│   └── images/                       # Product images
│
├── 22810310267_SuLi_DB.sql          # Database schema
├── package.json                      # Root dependencies
├── .env.production                   # Production env vars
├── deploy-vercel.sh                  # Deployment script
└── README.md                         # This file
```

---

## 🗄️ CƠ SỞ DỮ LIỆU

### Database Schema (PostgreSQL)

Hệ thống sử dụng **31 bảng** với quan hệ phức tạp:

#### 📊 Sơ đồ quan hệ chính

```
Users (Id) ──┬─► Orders (UserId)
             │   └─► OrderDetails (OrderId)
             │       ├─► Food (FoodId)
             │       ├─► Size (SizeID)
             │       └─► OrderDetails_Topping (OrderDetailId)
             │           └─► Topping (ToppingID)
             │
             ├─► GioHang (UserId)
             │   ├─► Food (FoodId)
             │   ├─► Size (SizeID)
             │   └─► GioHang_Topping (GioHangID)
             │       └─► Topping (ToppingID)
             │
             ├─► DeliveryAddresses (UserId)
             ├─► UserVouchers (UserId)
             └─► Notifications (UserId)

Orders ──┬─► OrderStatus (StatusId)
         ├─► PaymentStatus (PaymentStatusId)
         ├─► PhuongThucThanhToan (PaymentMethodId)
         ├─► Vouchers (VoucherId)
         ├─► CuaHang (CuaHangId)
         └─► ShippingOrders (OrderId)

Food ──┬─► Category (CategoryId)
       ├─► FoodIngredient (FoodId)
       │   └─► Ingredient (IngredientId)
       └─► FoodDimensions (FoodId)
```

#### 📝 Bảng quan trọng

**1. Users** - Quản lý người dùng
```sql
- Id (PK)
- Username, Email (Unique)
- PasswordHash (BCrypt)
- FullName, Phone, Address
- Province, District, Ward
- Role (User/Admin)
- OTPCode, OTPExpiry (Email verification)
- ResetToken, ResetTokenExpiry (Password reset)
- AvatarUrl (Profile picture)
```

**2. Orders** - Đơn hàng
```sql
- OrderId (PK)
- UserId (FK)
- OrderDate, TotalAmount
- StatusId (FK) → OrderStatus
- PaymentMethodId (FK)
- PaymentStatusId (FK)
- VoucherId (FK)
- CuaHangId (FK)
- ShippingFee, DiscountAmount
- DeliveryAddress, Province, District, Ward
- Phone, ReceiverName
```

**3. OrderDetails** - Chi tiết đơn hàng
```sql
- OrderDetailId (PK)
- OrderId (FK)
- FoodId (FK)
- SizeID (FK)
- Quantity, Price
- Note
```

**4. Food** - Sản phẩm
```sql
- FoodId (PK)
- FoodName, Price, DiscountPrice
- CategoryId (FK)
- Description
- ImageURL
- Stock, IsAvailable
```

**5. GioHang** - Giỏ hàng
```sql
- GioHangID (PK)
- UserId (FK)
- FoodId (FK)
- SizeID (FK)
- SoLuong, TotalPrice
```

**6. ShippingOrders** - Vận chuyển GHN
```sql
- Id (PK)
- OrderId (FK)
- GHNOrderCode (Mã vận đơn)
- ExpectedDeliveryTime
- ShippingFee
- Status (created/delivering/delivered/cancelled)
```

**7. Vouchers** - Mã giảm giá
```sql
- VoucherId (PK)
- Code (Unique)
- DiscountPercentage
- MaxDiscount, MinOrderValue
- StartDate, EndDate
- UsageLimit, UsedCount
```

**8. CuaHang** - Chi nhánh cửa hàng
```sql
- CuaHangId (PK)
- CuaHangName, Address
- Province, District, Ward
- Phone, Latitude, Longitude
- ShopId (GHN Shop ID)
```

### Indexes & Performance

```sql
-- Indexes for fast queries
CREATE INDEX idx_orders_userid ON "Orders"("UserId");
CREATE INDEX idx_orders_status ON "Orders"("StatusId");
CREATE INDEX idx_orders_date ON "Orders"("OrderDate" DESC);
CREATE INDEX idx_orderdetails_orderid ON "OrderDetails"("OrderId");
CREATE INDEX idx_giohang_userid ON "GioHang"("UserId");
CREATE INDEX idx_food_category ON "Food"("CategoryId");
CREATE INDEX idx_vouchers_code ON "Vouchers"("Code");
```

---

## 🚀 TÍNH NĂNG CHI TIẾT

### 👤 NGƯỜI DÙNG (User Features)

#### 1. Xác thực & Bảo mật
- ✅ **Đăng ký tài khoản**
  - Email verification với OTP
  - Password strength validation
  - BCrypt password hashing
  
- ✅ **Đăng nhập**
  - Username/email + password
  - Google OAuth 2.0
  - JWT token-based authentication
  - Token refresh mechanism
  
- ✅ **Quên mật khẩu**
  - Email reset token
  - Secure password reset flow
  - Token expiration (15 minutes)

#### 2. Duyệt sản phẩm
- 🔍 **Tìm kiếm & Lọc**
  - Search by name
  - Filter by category
  - Price range filter
  - Sort by price, popularity, newest
  
- 📦 **Chi tiết sản phẩm**
  - High-quality images
  - Product description
  - Size options (S, M, L)
  - Topping customization
  - Stock availability
  - Discount pricing

#### 3. Giỏ hàng (Real-time)
- 🛒 **Quản lý giỏ hàng**
  - Add/remove items
  - Update quantity
  - Select size & toppings
  - Calculate total automatically
  - Persistent cart (database-backed)
  - Real-time sync across devices

#### 4. Đặt hàng
- 📋 **Pre-order validation**
  - Check product availability
  - Validate stock
  - Calculate shipping fee by distance
  - Apply voucher codes
  
- 💰 **Thanh toán**
  - **VNPay QR Code**: Quét mã thanh toán
  - **COD**: Thanh toán khi nhận hàng
  - **Chuyển khoản**: Transfer banking
  
- 📍 **Địa chỉ giao hàng**
  - Save multiple addresses
  - Google Maps integration
  - Auto-geocoding
  - Province/District/Ward selection

#### 5. Theo dõi đơn hàng
- 📊 **Trạng thái đơn hàng**
  - Chưa hoàn tất (Draft)
  - Chờ xác nhận (Pending)
  - Đã xác nhận (Confirmed)
  - Đang giao (Delivering)
  - Đã giao (Delivered)
  - Đã hủy (Cancelled)
  
- 🔔 **Thông báo real-time**
  - Order status updates
  - Payment confirmation
  - Shipping updates
  - Delivery notification

#### 6. Quản lý tài khoản
- 👤 **Thông tin cá nhân**
  - Update profile
  - Change password
  - Upload avatar
  - Manage addresses
  
- 🎫 **Vouchers**
  - View available vouchers
  - Apply to orders
  - Track usage history
  
- 📜 **Lịch sử đơn hàng**
  - Order list with filters
  - Order details
  - Download invoices
  - Re-order functionality

### 👨‍💼 QUẢN TRỊ VIÊN (Admin Features)

#### 1. Dashboard
- 📈 **Thống kê tổng quan**
  - Revenue charts (daily/monthly/yearly)
  - Order statistics
  - Product performance
  - User growth
  - Real-time metrics
  
- 🔔 **Thông báo real-time**
  - New orders
  - Payment confirmations
  - Low stock alerts
  - Customer messages

#### 2. Quản lý đơn hàng
- 📦 **Order Management**
  - View all orders
  - Filter by status/date/customer
  - Update order status
  - Cancel orders
  - Print invoices
  - Export to Excel
  
- 🚚 **Giao hàng**
  - Create GHN shipping orders
  - Track delivery status
  - Update shipping info
  - Handle returns

#### 3. Quản lý sản phẩm
- ☕ **Foods**
  - CRUD operations
  - Bulk upload images (Supabase)
  - Set prices & discounts
  - Manage stock levels
  - Product variants (sizes)
  
- 🏷️ **Categories**
  - Create/edit categories
  - Assign products
  - Category hierarchy
  
- 🧃 **Toppings**
  - Add topping options
  - Set topping prices
  - Enable/disable toppings

#### 4. Quản lý kho
- 📊 **Inventory**
  - Track ingredient stock
  - Low stock warnings
  - Restock notifications
  - Inventory reports
  
- 📥 **Import/Export**
  - Import ingredients
  - Export inventory data
  - Excel integration

#### 5. Quản lý khách hàng
- 👥 **Users**
  - View user list
  - User details
  - Order history per user
  - Ban/unban users
  
- 🎫 **Vouchers**
  - Create voucher campaigns
  - Set discount rules
  - Assign to users
  - Track usage

#### 6. Nhân viên
- 👔 **Staff Management**
  - Add/edit staff
  - Role assignment
  - Access control
  - Activity logs

#### 7. Báo cáo
- 📊 **Revenue Reports**
  - Daily/monthly/yearly revenue
  - Revenue by product
  - Revenue by category
  - Payment method breakdown
  
- 🏆 **Bestseller Reports**
  - Top products
  - Customer favorites
  - Seasonal trends

### 🔒 BẢO MẬT (Security Features)

#### 1. Content Security Policy (CSP)
```javascript
// Real-time CSP monitoring
{
  nonce: "random-generated-nonce",
  scriptSrc: ["'self'", "'nonce-xxx'"],
  styleSrc: ["'self'", "'unsafe-inline'"],
  imgSrc: ["'self'", "data:", "https:"],
  connectSrc: ["'self'", "wss:", "https:"],
  reportUri: "/api/csp-report"
}
```
- Nonce-based script execution
- Strict CSP directives
- Violation reporting & logging
- Real-time dashboard

#### 2. Authentication & Authorization
- JWT token with expiration
- Bcrypt password hashing (salt rounds: 10)
- Role-based access control (RBAC)
- OAuth 2.0 Google integration
- Secure token storage

#### 3. API Security
- Rate limiting
- CORS configuration
- Input validation & sanitization
- SQL injection prevention (Sequelize ORM)
- XSS protection
- CSRF tokens

#### 4. Additional Security
- Clickjacking protection (X-Frame-Options)
- HTTPS enforcement
- Security headers middleware
- Secure cookie flags
- Environment variable protection

---

## 🔄 LUỒNG HOẠT ĐỘNG

### 📱 Luồng đặt hàng của khách hàng

```
1. ĐĂNG NHẬP
   ├─► [Frontend] Login form → API /api/auth/login
   ├─► [Backend] Validate credentials → JWT token
   └─► [Frontend] Store token → Redirect to home

2. DUYỆT SẢN PHẨM
   ├─► [Frontend] Product list → API /api/products
   ├─► [Backend] Query Food + Category + Size
   └─► [Frontend] Display products with filters

3. THÊM VÀO GIỎ HÀNG
   ├─► [Frontend] Select size & toppings → API /api/cart/add
   ├─► [Backend] Validate product → Insert GioHang
   ├─► [Socket.IO] Emit cart:update event
   └─► [Frontend] Update cart badge (real-time)

4. CHECKOUT
   ├─► [Frontend] Cart review → API /api/orders/prepare
   ├─► [Backend] Validate stock + Calculate shipping
   │   ├─► Call GHN API for shipping fee
   │   ├─► Apply voucher discount
   │   └─► Return order summary
   └─► [Frontend] Show checkout form

5. CHỌN PHƯƠNG THỨC THANH TOÁN
   ├─► Option 1: VNPay QR Code
   │   ├─► [Frontend] API /api/orders/place-order
   │   ├─► [Backend] Create order → Generate VNPay URL
   │   ├─► [Frontend] Redirect to VNPay
   │   ├─► [User] Scan QR & Pay
   │   ├─► [VNPay] Callback → /api/orders/vnpay-return
   │   └─► [Backend] Verify signature → Update payment status
   │
   ├─► Option 2: COD
   │   ├─► [Frontend] API /api/orders/place-order
   │   ├─► [Backend] Create order with pending payment
   │   ├─► Create GHN shipping order
   │   └─► Clear cart
   │
   └─► Option 3: Bank Transfer
       └─► Similar to QR Code flow

6. TẠO ĐƠN GIAO HÀNG (GHN)
   ├─► [Backend] Call GHN API /v2/shipping-order/create
   │   ├─► Required data:
   │   │   ├─► Shop info (from CuaHang)
   │   │   ├─► Customer address (from DeliveryAddresses)
   │   │   ├─► Items weight & dimensions
   │   │   ├─► COD amount (if applicable)
   │   │   └─► Service type & payment type
   │   └─► Response: GHN order code
   ├─► [Backend] Save to ShippingOrders table
   └─► [Backend] Return order confirmation

7. THÔNG BÁO REAL-TIME
   ├─► [Backend] Socket.IO emitToUser(userId, "order:new")
   ├─► [Backend] Socket.IO emitToAdmins("order:new")
   ├─► [Frontend User] Display notification
   └─► [Frontend Admin] Add to order list

8. THEO DÕI ĐƠN HÀNG
   ├─► [Frontend] API /api/profile/orders
   ├─► [Backend] Query Orders + OrderDetails + Status
   ├─► [Socket.IO] Listen "order:status" event
   └─► [Frontend] Update status real-time
```

### 🔔 Luồng cập nhật trạng thái (Real-time)

```
1. ADMIN CẬP NHẬT TRẠNG THÁI
   ├─► [Admin Frontend] Click "Xác nhận đơn"
   ├─► API /api/admin/orders/:id/status
   └─► [Backend] Update Orders.StatusId

2. EMIT SOCKET EVENT
   ├─► [Backend] realtimeHelper.emitOrderStatusChange()
   │   ├─► emitToUser(userId, "order:status", data)
   │   └─► emitToAdmins("order:status-change", data)
   └─► Socket.IO broadcast

3. FRONTEND NHẬN EVENT
   ├─► [User App] useSocket hook listens "order:status"
   ├─► Update local state
   └─► Show toast notification

4. GHN WEBHOOK (Nếu có cập nhật vận chuyển)
   ├─► [GHN] POST /api/webhooks/ghn
   ├─► [Backend] Verify signature
   ├─► Update ShippingOrders status
   ├─► Update Orders status if delivered
   └─► Emit socket events
```

### 👨‍💼 Luồng quản lý admin

```
1. ADMIN LOGIN
   ├─► [Frontend] /login → API /api/admin/auth/login
   ├─► [Backend] Validate role = "admin"
   └─► JWT token with role claim

2. DASHBOARD
   ├─► [Frontend] /admin/dashboard
   ├─► API /api/admin/home/stats
   ├─► [Backend] Aggregate queries:
   │   ├─► Total revenue (SUM Orders.TotalAmount)
   │   ├─► Order count by status
   │   ├─► Top selling products
   │   └─► Recent orders
   └─► Real-time Socket.IO connection

3. QUẢN LÝ ĐƠN HÀNG
   ├─► [Frontend] /admin/orders
   ├─► API /api/admin/orders?status=pending
   ├─► [Backend] Query with filters
   ├─► Display order list
   └─► Actions:
       ├─► Xem chi tiết → API /api/admin/invoice/:id
       ├─► Xác nhận → API /api/admin/orders/:id/confirm
       ├─► Hủy → API /api/admin/orders/:id/cancel
       └─► In hóa đơn → window.print()

4. QUẢN LÝ SẢN PHẨM
   ├─► [Frontend] /admin/foods
   ├─► CRUD operations:
   │   ├─► List: API /api/admin/foods
   │   ├─► Add: API /api/admin/foods/add
   │   ├─► Edit: API /api/admin/foods/edit/:id
   │   └─► Delete: API /api/admin/foods/delete/:id
   └─► Image upload: Supabase Storage

5. BÁO CÁO
   ├─► [Frontend] /admin/report/revenue
   ├─► API /api/admin/report/revenue?period=month
   ├─► [Backend] Complex aggregation query
   └─► Chart.js visualization
```

---

## 🔧 GIẢI QUYẾT VẤN ĐỀ

### 1. ⏰ Vấn đề Timezone mismatch

**Mô tả chi tiết:**
- **Local environment**: Thời gian hiển thị 18:05 (GMT+7) - đúng
- **Production (Cloudflare)**: Thời gian hiển thị 01:05 (UTC) - sai 7 giờ
- **Root cause**: Sequelize config `timezone: "+07:00"` + `useUTC: false` lưu VN time vào DB local, nhưng Cloudflare server UTC làm sai lệch

**Giải pháp áp dụng:**

```javascript
// ✅ backend/config/sequelize.js
const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  dialect: 'postgres',
  timezone: '+00:00', // Lưu UTC trong database
  // Removed: useUTC: false
  dialectOptions: {
    ssl: { require: true, rejectUnauthorized: false }
  }
});
```

```javascript
// ✅ frontend - Tất cả nơi hiển thị thời gian
new Date(order.OrderDate).toLocaleString('vi-VN', {
  timeZone: 'Asia/Ho_Chi_Minh', // Convert sang VN time
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit'
});
```

**Kết quả:** Cả local và production đều hiển thị đúng giờ Việt Nam

---

### 2. 🛒 Cart sync across devices

**Vấn đề:** Cart lưu localStorage mất khi đổi thiết bị

**Giải pháp: Database-backed cart**

```javascript
// backend/routes/user/cartUser.js
router.post('/add', verifyToken, async (req, res) => {
  const { FoodId, SizeID, SoLuong, toppings } = req.body;
  const userId = req.user.id;
  
  const transaction = await sequelize.transaction();
  try {
    let cartItem = await GioHang.findOne({
      where: { UserId: userId, FoodId, SizeID },
      transaction
    });
    
    if (cartItem) {
      await cartItem.increment('SoLuong', { by: SoLuong, transaction });
    } else {
      cartItem = await GioHang.create({
        UserId: userId, FoodId, SizeID, SoLuong
      }, { transaction });
    }
    
    // Handle toppings
    if (toppings?.length > 0) {
      await GioHang_Topping.bulkCreate(
        toppings.map(t => ({
          GioHangID: cartItem.GioHangID,
          ToppingID: t.ToppingID
        })),
        { transaction }
      );
    }
    
    await transaction.commit();
    
    // Real-time notification
    realtimeHelper.emitToUser(userId, 'cart:update', {
      cartCount: await getCartCount(userId)
    });
    
    res.json({ success: true });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ error: error.message });
  }
});
```

---

### 3. 💳 VNPay signature verification

**Vấn đề:** Payment callback trả về "Invalid signature"

**Nguyên nhân:** Thứ tự params và encoding không đúng

**Giải pháp:**

```javascript
router.get('/vnpay-return', async (req, res) => {
  const vnpParams = req.query;
  const secureHash = vnpParams['vnp_SecureHash'];
  
  delete vnpParams['vnp_SecureHash'];
  delete vnpParams['vnp_SecureHashType'];
  
  // ✅ Sort alphabetically
  const sortedParams = Object.keys(vnpParams)
    .sort()
    .reduce((acc, key) => {
      acc[key] = vnpParams[key];
      return acc;
    }, {});
  
  const signData = querystring.stringify(sortedParams, { encode: true });
  const hmac = crypto.createHmac('sha512', VNP_HASH_SECRET);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
  
  if (secureHash === signed) {
    // ✅ Valid payment
    await updateOrderStatus(vnpParams);
    res.redirect('/successful');
  } else {
    res.status(400).json({ error: 'Invalid signature' });
  }
});
```

---

### 4. 🚚 GHN shipping fee = 0

**Vấn đề:** API trả về shipping_fee = 0

**Nguyên nhân:** Thiếu ShopId trong header

**Giải pháp:**

```javascript
const calculateShippingFee = async (toDistrictId, toWardCode, weight) => {
  const response = await axios.post(
    `${GHN_API_URL}/v2/shipping-order/fee`,
    {
      service_type_id: 2,
      from_district_id: 1542,
      to_district_id: parseInt(toDistrictId),
      to_ward_code: toWardCode,
      weight: weight || 500,
      height: 15,
      length: 20,
      width: 15
    },
    {
      headers: {
        'Token': GHN_API_KEY,
        'ShopId': GHN_SHOP_ID // ✅ Required!
      }
    }
  );
  
  return response.data.data.total;
};
```

---

### 5. 🔌 Socket.IO không reconnect

**Giải pháp:**

```javascript
// frontend/src/hooks/useSocket.js
const socketInstance = io(SOCKET_URL, {
  transports: ['websocket', 'polling'],
  reconnection: true, // ✅ Auto reconnect
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});

socketInstance.on('connect', () => {
  // Re-register after reconnect
  const user = JSON.parse(localStorage.getItem('user'));
  if (user) {
    socketInstance.emit('register', {
      role: user.Role,
      userId: user.Id
    });
  }
});
```

---

### 6. 🛡️ CSP blocking resources

**Giải pháp: Nonce-based CSP**

```javascript
const cspMiddleware = (req, res, next) => {
  const nonce = crypto.randomBytes(16).toString('base64');
  res.locals.cspNonce = nonce;
  
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' wss: https://api.supabase.co"
  ].join('; ');
  
  res.setHeader('Content-Security-Policy', csp);
  next();
};
```

---

## 🐛 BUGS & SOLUTIONS

### Bug Timeline

**Bug #1: Double timezone conversion (Fixed 08/12/2025)**

| Environment | Input | Database | Display | Status |
|-------------|-------|----------|---------|--------|
| Local (Before) | 18:05 VN | 18:05 (+07:00) | 01:05 ❌ | Wrong |
| Production (Before) | 18:05 VN | 11:05 (UTC auto) | 18:05 ✅ | Correct |
| Both (After Fix) | 18:05 VN | 11:05 (UTC) | 18:05 ✅ | Correct |

**Solution:** UTC storage + frontend conversion

---

**Bug #2: Pending orders không auto-cancel**

```javascript
// ✅ Fixed: Auto-cancel after 30 minutes
const autoCancelPendingOrders = async () => {
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
  
  const pending = await Orders.findAll({
    where: {
      StatusId: 1,
      PaymentStatusId: 1,
      OrderDate: { [Op.lt]: thirtyMinutesAgo }
    }
  });
  
  for (const order of pending) {
    await order.update({ StatusId: 6 }); // Cancelled
  }
};

setInterval(autoCancelPendingOrders, 60000); // Every 60s
```

---

**Bug #3: Image upload fails on production**

```javascript
// ✅ Fixed: Hybrid upload service
const uploadImage = async (file) => {
  if (process.env.NODE_ENV === 'production') {
    // Supabase Storage
    return await supabase.storage
      .from('product-images')
      .upload(file.originalname, file.buffer);
  } else {
    // Local filesystem
    await fs.promises.writeFile(localPath, file.buffer);
    return localPath;
  }
};
```

---

**Bug #4: Admin dashboard không real-time**

```javascript
// ❌ Before: Wrong emit
socket.emit('order:new', data); // Only to sender

// ✅ After: Broadcast to room
io.to('admin-room').emit('order:new', data);
```

---

**Bug #5: Voucher dùng nhiều lần**

```javascript
// ✅ Fixed: Check usage limit
const voucher = await Vouchers.findOne({ where: { Code } });

if (voucher.UsedCount >= voucher.UsageLimit) {
  throw new Error('Voucher đã hết lượt sử dụng');
}

await voucher.increment('UsedCount');
```

---

### Common Errors Reference

| Error | Cause | Solution |
|-------|-------|----------|
| `ECONNREFUSED` | Database offline | Check PostgreSQL service |
| `jwt malformed` | Invalid token | Clear localStorage, re-login |
| `CORS error` | Origin not allowed | Add to allowedOrigins |
| `Sequelize timeout` | Slow query | Add indexes, optimize |
| `Socket not connected` | Network/firewall | Enable WebSocket |
| `VNPay invalid signature` | Wrong hash secret | Verify VNP_HASH_SECRET |
| `GHN 401` | Wrong API key | Check GHN_API_KEY |
| `File upload failed` | Supabase config | Verify SUPABASE_KEY |

---

## 🤖 PHƯƠNG PHÁP AI & CHATBOT

### AI Integration Architecture

```
User Message → ChatBot Component
     ↓
POST /api/chatbot/ask
     ↓
chatbotService.js
     ↓
Build Context:
  - Menu items (Food table)
  - Categories
  - Bestsellers (last 7 days)
  - User order history
     ↓
Prompt Engineering:
  System: "Bạn là nhân viên SuLi Coffee..."
  Context: {menu, categories, bestsellers, history}
  User: question
     ↓
OpenAI API Call (GPT-3.5-turbo)
     ↓
Response Processing:
  - Extract recommendations
  - Format Vietnamese
  - Add product links
     ↓
Return JSON to frontend → Display in chat
```

### Implementation Code

```javascript
// backend/services/chatbotService.js
const { OpenAI } = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const askChatbot = async (question, userId = null) => {
  // Build context from database
  const context = await buildContext(userId);
  
  const systemPrompt = `
Bạn là nhân viên tư vấn của SuLi Coffee.

Menu hiện tại:
${JSON.stringify(context.menu, null, 2)}

Bestsellers tuần này:
${context.bestsellers.map(b => `- ${b.FoodName} (${b.orderCount} đơn)`).join('\n')}

Nhiệm vụ:
1. Tư vấn món phù hợp với khách
2. Giải thích hương vị, thành phần
3. Gợi ý combo/topping
4. Giọng điệu thân thiện, nhiệt tình

Quy tắc:
- Chỉ tư vấn món có trong menu
- Hỏi về sở thích (đắng/ngọt, nóng/lạnh)
- Suggest upsell tinh tế
  `;
  
  if (userId) {
    const history = await getOrderHistory(userId);
    systemPrompt += `\n\nLịch sử đơn khách:\n${history.map(o => `- ${o.items}`).join('\n')}`;
  }
  
  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: question }
    ],
    temperature: 0.7,
    max_tokens: 500
  });
  
  const answer = completion.choices[0].message.content;
  const recommendations = extractRecommendations(answer, context.menu);
  
  return { answer, recommendations };
};

module.exports = { askChatbot };
```

### AI Features

**Current:**
- ✅ Context-aware Q&A
- ✅ Product recommendations
- ✅ Vietnamese language support

**Future:**
- 🔄 Sentiment analysis
- 🔄 Personalized ML recommendations
- 🔄 Voice input
- 🔄 Image recognition

---

## 🌐 API ENDPOINTS

### Authentication APIs

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Đăng ký tài khoản mới | ❌ |
| POST | `/api/auth/login` | Đăng nhập | ❌ |
| POST | `/api/auth/verify-otp` | Xác thực OTP email | ❌ |
| POST | `/api/auth/forgot-password` | Quên mật khẩu | ❌ |
| POST | `/api/auth/reset-password` | Reset mật khẩu | ❌ |
| GET | `/auth/google` | Google OAuth login | ❌ |
| GET | `/auth/google/callback` | Google OAuth callback | ❌ |

### User APIs

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/products` | Lấy danh sách sản phẩm | ❌ |
| GET | `/api/products/:id` | Chi tiết sản phẩm | ❌ |
| GET | `/api/cart` | Xem giỏ hàng | ✅ |
| POST | `/api/cart/add` | Thêm vào giỏ | ✅ |
| PUT | `/api/cart/update/:id` | Cập nhật số lượng | ✅ |
| DELETE | `/api/cart/remove/:id` | Xóa khỏi giỏ | ✅ |
| POST | `/api/orders/prepare` | Chuẩn bị đơn hàng | ✅ |
| POST | `/api/orders/place-order` | Đặt hàng | ✅ |
| GET | `/api/orders/pending` | Đơn hàng nháp | ✅ |
| POST | `/api/orders/save-pending` | Lưu đơn nháp | ✅ |
| GET | `/api/orders/:id` | Chi tiết đơn hàng | ✅ |
| GET | `/api/orders/vnpay-return` | VNPay callback | ❌ |
| POST | `/api/orders/reorder/:id` | Đặt lại đơn hàng | ✅ |
| GET | `/api/profile` | Thông tin tài khoản | ✅ |
| PUT | `/api/profile/update` | Cập nhật profile | ✅ |
| GET | `/api/profile/orders` | Lịch sử đơn hàng | ✅ |
| GET | `/api/addresses` | Địa chỉ giao hàng | ✅ |
| POST | `/api/addresses/save` | Lưu địa chỉ | ✅ |
| POST | `/api/orders/geocode` | Geocode địa chỉ | ✅ |

### Admin APIs

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/home/stats` | Thống kê dashboard | 👑 |
| GET | `/api/admin/orders` | Danh sách đơn hàng | 👑 |
| GET | `/api/admin/invoice/:id` | Chi tiết hóa đơn | 👑 |
| PUT | `/api/admin/orders/:id/status` | Cập nhật trạng thái | 👑 |
| GET | `/api/admin/foods` | Danh sách sản phẩm | 👑 |
| POST | `/api/admin/foods/add` | Thêm sản phẩm | 👑 |
| PUT | `/api/admin/foods/edit/:id` | Sửa sản phẩm | 👑 |
| DELETE | `/api/admin/foods/delete/:id` | Xóa sản phẩm | 👑 |
| GET | `/api/admin/categories` | Danh mục | 👑 |
| GET | `/api/admin/ingredients` | Nguyên liệu | 👑 |
| GET | `/api/admin/users` | Người dùng | 👑 |
| GET | `/api/admin/voucher` | Voucher | 👑 |
| POST | `/api/admin/voucher/create` | Tạo voucher | 👑 |
| GET | `/api/admin/report/revenue` | Báo cáo doanh thu | 👑 |
| GET | `/api/admin/report/bestseller` | Sản phẩm bán chạy | 👑 |

### Webhook APIs

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/webhooks/ghn` | GHN delivery webhook | 🔐 |
| POST | `/api/webhooks/vnpay` | VNPay payment webhook | 🔐 |

### Socket.IO Events

**Client → Server**

| Event | Description | Data |
|-------|-------------|------|
| `register` | Đăng ký client | `{ role: "user/admin", userId }` |
| `disconnect` | Ngắt kết nối | - |

**Server → Client**

| Event | Description | Data |
|-------|-------------|------|
| `order:new` | Đơn hàng mới | `{ orderId, userId, ... }` |
| `order:status` | Cập nhật trạng thái | `{ orderId, status, message }` |
| `order:update` | Cập nhật đơn hàng | `{ orderId, ... }` |
| `notification` | Thông báo chung | `{ title, message, type }` |
| `cart:update` | Giỏ hàng thay đổi | `{ userId, items }` |
| `voucher:update` | Voucher mới | `{ voucherId, code }` |

---

## 💻 CÀI ĐẶT VÀ TRIỂN KHAI

### Yêu cầu hệ thống

- **Node.js**: ≥16.0.0
- **PostgreSQL**: ≥13.0
- **NPM**: ≥8.0.0
- **Git**: Latest version

### 1. Clone repository

```bash
git clone https://github.com/thlien20904/Suli_Coffee_Web.git
cd Suli_Coffee_Web
```

### 2. Cài đặt Backend

```bash
cd backend
npm install
```

**Tạo file `.env`:**

```env
# Database
DB_NAME=suli_coffee_db
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=aws-0-ap-southeast-1.pooler.supabase.com
DB_PORT=6543
DB_SSL=true

# JWT
JWT_SECRET=your_super_secret_jwt_key_here

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/auth/google/callback
GOOGLE_CALLBACK_URL_PROD=https://your-backend.com/auth/google/callback

# Frontend URL
FRONTEND_URL=http://localhost:3000
FRONTEND_URL_PROD=https://your-frontend.com

# VNPay
VNP_TMN_CODE=your_vnpay_tmn_code
VNP_HASH_SECRET=your_vnpay_hash_secret
VNP_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNP_RETURN_URL=http://localhost:3000/vnpay-return

# Giao Hàng Nhanh (GHN)
GHN_API_KEY=your_ghn_api_key
GHN_SHOP_ID=your_ghn_shop_id
GHN_API_URL=https://online-gateway.ghn.vn/shiip/public-api

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_anon_key

# SendGrid (Email)
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@suli.com

# Server
PORT=5000
NODE_ENV=development
```

**Import database:**

```bash
psql -U postgres -d suli_coffee_db -f ../22810310267_SuLi_DB.sql
```

**Chạy development server:**

```bash
npm run dev
```

Server chạy tại: `http://localhost:5000`

### 3. Cài đặt Frontend

```bash
cd ../frontend
npm install
```

**Tạo file `.env`:**

```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SOCKET_URL=http://localhost:5000
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

**Chạy development server:**

```bash
npm start
```

Frontend chạy tại: `http://localhost:3000`

### 4. Chạy đồng thời (Recommended)

Từ thư mục gốc:

```bash
npm install
npm start
```

Lệnh này sẽ chạy cả backend và frontend đồng thời sử dụng `concurrently`.

---

## 🚀 TRIỂN KHAI PRODUCTION

### Backend Deployment (Vercel/Railway/Render)

**1. Chuẩn bị:**

```bash
cd backend
npm install --production
```

**2. Environment Variables:**

Thiết lập các biến môi trường trên platform:
- Tất cả các biến trong `.env`
- `NODE_ENV=production`
- Cập nhật `FRONTEND_URL_PROD`

**3. Deploy:**

```bash
# Vercel
vercel --prod

# Railway
railway up

# Render
# Push to GitHub và connect từ Render dashboard
```

### Frontend Deployment (Cloudflare Pages/Vercel)

**1. Build:**

```bash
cd frontend
npm run build
```

**2. Deploy to Cloudflare Pages:**

```bash
npm install -g wrangler
wrangler pages publish build --project-name=suli-coffee
```

**3. Deploy to Vercel:**

```bash
vercel --prod
```

**4. Cấu hình Cloudflare Worker:**

File `public/_worker.js` đã được cấu hình sẵn để:
- Serve static files
- Handle routing
- Set security headers

---

## 🛡️ BẢO MẬT

### Content Security Policy (CSP)

Hệ thống sử dụng CSP nghiêm ngặt với:

```javascript
const cspDirectives = {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'", "'nonce-{random}'"],
  styleSrc: ["'self'", "'unsafe-inline'"],
  imgSrc: ["'self'", "data:", "https:"],
  connectSrc: ["'self'", "wss:", "https://api.supabase.co"],
  fontSrc: ["'self'", "https://fonts.gstatic.com"],
  objectSrc: ["'none'"],
  mediaSrc: ["'self'"],
  frameSrc: ["'none'"]
};
```

**CSP Dashboard**: `http://localhost:5000/csp`

Theo dõi real-time:
- CSP violations
- Blocked resources
- Security reports

### Authentication Flow

1. **Password Hashing**: BCrypt với salt rounds = 10
2. **JWT Tokens**: 
   - Access token: 1 hour expiration
   - Refresh token: 7 days expiration
3. **OAuth 2.0**: Google authentication với secure callbacks
4. **OTP Verification**: 6-digit OTP, 10 minutes expiration

### API Security

- **Rate Limiting**: 100 requests/15 minutes per IP
- **CORS**: Whitelist specific origins
- **Input Validation**: Joi schema validation
- **SQL Injection**: Sequelize parameterized queries
- **XSS Protection**: HTML sanitization
- **CSRF**: Token-based protection

---

## 📊 TỐI ƯU HÓA

### Database Optimization

- **Indexes**: Tối ưu truy vấn thường xuyên
- **Connection Pooling**: Max 5 connections
- **Query Optimization**: Join hiệu quả, select specific columns
- **Caching**: Redis cache cho queries phổ biến (future)

### Frontend Performance

- **Code Splitting**: React.lazy() cho route-based splitting
- **Image Optimization**: Lazy loading, responsive images
- **Bundle Size**: Tree shaking, minification
- **Caching**: Service Workers (PWA ready)

### Real-time Optimization

- **Socket.IO**: 
  - Emit to specific rooms (admin-room, user-{id})
  - Avoid broadcasting unnecessary events
  - Connection pooling
  
- **Event Throttling**: Debounce high-frequency events

---

## 📱 RESPONSIVE DESIGN

Hệ thống được tối ưu cho:

- 📱 **Mobile**: 320px - 767px
- 📱 **Tablet**: 768px - 1023px
- 💻 **Desktop**: 1024px+
- 🖥️ **Large Desktop**: 1440px+

Breakpoints:

```css
/* Mobile */
@media (max-width: 767px) { ... }

/* Tablet */
@media (min-width: 768px) and (max-width: 1023px) { ... }

/* Desktop */
@media (min-width: 1024px) { ... }
```

---

## 🧪 TESTING

### Unit Testing (Future)

```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

### Manual Testing Checklist

- [ ] User registration & login
- [ ] Product browsing & filtering
- [ ] Add to cart functionality
- [ ] Checkout process
- [ ] Payment integration (VNPay)
- [ ] Order tracking
- [ ] Admin dashboard
- [ ] Order management
- [ ] Product CRUD
- [ ] Real-time notifications
- [ ] CSP compliance
- [ ] Mobile responsiveness

---

## 🐛 TROUBLESHOOTING

### Common Issues

**1. Database connection failed**
```
Error: connect ECONNREFUSED
```
✅ Solution: Check PostgreSQL is running, verify `.env` credentials

**2. JWT token invalid**
```
Error: jwt malformed
```
✅ Solution: Clear localStorage, login again, check JWT_SECRET

**3. Socket.IO not connecting**
```
WebSocket connection failed
```
✅ Solution: Check CORS settings, verify Socket.IO server is running

**4. VNPay payment failed**
```
Invalid signature
```
✅ Solution: Verify VNP_HASH_SECRET, check data encoding

**5. GHN order creation failed**
```
Shop not found
```
✅ Solution: Verify GHN_SHOP_ID and API key, check CuaHang.ShopId

---

## 📚 TÀI LIỆU THAM KHẢO

- [React Documentation](https://react.dev/)
- [Express.js Guide](https://expressjs.com/)
- [Sequelize ORM](https://sequelize.org/)
- [Socket.IO Documentation](https://socket.io/docs/)
- [VNPay Integration Guide](https://sandbox.vnpayment.vn/apis/)
- [GHN API Documentation](https://api.ghn.vn/home/docs/detail)
- [PostgreSQL Manual](https://www.postgresql.org/docs/)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

---

## 👥 TEAM & CREDITS

**Developer**: Nguyễn Thúy Liên (22810310267)

**Instructor**: Giảng viên môn Ngôn ngữ kịch bản

**University**: HK1 2025-2026

---

## 📄 LICENSE

ISC License - Free to use for educational purposes

---

## 🔮 FUTURE ENHANCEMENTS

- [ ] Mobile app (React Native)
- [ ] Progressive Web App (PWA)
- [ ] AI-powered recommendations
- [ ] Advanced analytics dashboard
- [ ] Multi-language support (i18n)
- [ ] Dark mode theme
- [ ] Social login (Facebook, Apple)
- [ ] Loyalty program & points
- [ ] Push notifications
- [ ] Inventory forecasting
- [ ] Automated marketing campaigns
- [ ] Integration with accounting software

---

## 📞 CONTACT & SUPPORT

- **Email**: thuylien.dev@gmail.com
- **GitHub**: [thlien20904](https://github.com/thlien20904)
- **Demo**: [https://suli-coffee-web.pages.dev](https://suli-coffee-web.pages.dev)

---

**Made with ☕ by SuLi Coffee Team**
