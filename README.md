# ☕ SuLi Coffee Web Application

## 1. Giới thiệu

**SuLi Coffee** là ứng dụng web quản lý và đặt đồ uống trực tuyến.
Hệ thống cho phép **khách hàng** đặt đồ uống, theo dõi đơn hàng, quản lý thông tin cá nhân và **admin** có thể quản lý toàn bộ hoạt động của cửa hàng như sản phẩm, nhân viên, đơn hàng và báo cáo.

## Tác giả

| Họ và tên              | MSSV        |
| ---------------------- | ----------- |
| 💠 **Điêu Thúy Liên**  | 22810310267 |
| 💠 **Phạm Đăng Khuê**  | 22810310270 |
| 💠 **Nguyễn Đức Minh** | 22810310235 |

## 2. Công nghệ sử dụng

### 🖥️ Frontend

- React.js
- Redux (quản lý state)
- CSS Modules
- Axios (gọi API)
- Socket.IO Client (real-time updates)

### ⚙️ Backend

- Node.js + Express.js
- Sequelize ORM (PostgreSQL/Supabase)
- JWT (xác thực người dùng)
- Passport.js (OAuth Google)
- Multer (upload hình ảnh)
- Bcrypt (mã hóa mật khẩu)
- Socket.IO (real-time communication)
- Content Security Policy (CSP) - bảo mật
- VNPay API (thanh toán)
- Giao Hàng Nhanh API (shipping)

### 🗄️ Database

- PostgreSQL (Supabase Cloud)
- Redis (session storage)

### 🔐 Bảo mật

- Content Security Policy (CSP)
- Clickjacking Protection
- CORS Configuration
- Rate Limiting
- Security Headers

## 3. Cấu trúc thư mục

📁 Backend

- backend/config/ – Cấu hình kết nối cơ sở dữ liệu

- backend/controllers/ – Xử lý logic nghiệp vụ

  admin/ – Controller cho admin

  user/ – Controller cho người dùng

- backend/models/ – Định nghĩa models Sequelize

- backend/routes/ – Định nghĩa API routes

  admin/ – API cho admin

  user/ – API cho người dùng

- backend/server.js – File khởi động backend

📁 Frontend

- frontend/src/components/ – Các React component tái sử dụng

- frontend/src/pages/ – Các trang chính của ứng dụng

- frontend/src/redux/ – Quản lý state toàn cục (Redux)

- frontend/public/ – Chứa favicon, index.html và các tài nguyên tĩnh

- frontend/public/images/ – Lưu hình ảnh minh họa, ảnh upload

📄 Database

- 22810310267_SuLiCofffe_Db.sql – File database xuất từ SQL Server

## 4. Yêu cầu hệ thống

- Node.js **v14+**
- Microsoft SQL Server
- npm hoặc yarn

## 5. Hướng dẫn cài đặt

### 5.1 Clone repository

git clone https://github.com/thlien20904/Suli_Coffee_Web.git
cd Suli_Coffee_Web

### 5.2 Import Database

1. Mở **Microsoft SQL Server Management Studio (SSMS)**
2. Tạo database mới tên: **WebAppDB**
3. Import file:
   22810310267_SuLICoffee_Db.sql

### 5.3 Cấu hình môi trường

Tạo file `.env` trong thư mục `backend/` với nội dung:

```env
# Database (PostgreSQL/Supabase)
DB_NAME=postgres
DB_USER=postgres.your_project_id
DB_PASSWORD=your_password
DB_HOST=aws-1-ap-southeast-2.pooler.supabase.com
DB_PORT=5432
DB_SSL=true

# Authentication
JWT_SECRET=your_jwt_secret_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Payment Gateway
VNPAY_TMN_CODE=your_vnpay_tmn_code
VNPAY_HASH_SECRET=your_vnpay_hash_secret
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:5000/api/user/orders/vnpay-return

# Shipping Service
GHN_TOKEN=your_ghn_token
GHN_SHOP_ID=your_ghn_shop_id
GHN_BASE_URL=https://dev-online-gateway.ghn.vn

# Server Configuration
PORT=5000
FRONTEND_URL=http://localhost:3000
```

### 5.4 Cài đặt dependencies

**Backend:**
cd backend
npm install
**Frontend:**
cd frontend
npm install
**Thư mục gốc**
npm install

### 5.5 Chạy ứng dụng

**Backend:**
cd backend
npm start
**Frontend:**
cd frontend
npm start
**Hoặc ở thư mục gốc chạy**
npm start

✅ Ứng dụng chạy tại:

- **Frontend:** [http://localhost:3000](http://localhost:3000)
- **Backend:** [http://localhost:5000](http://localhost:5000)

## 6. Tài khoản demo

| Vai trò | Username | Password |
| ------- | -------- | -------- |
| Admin   | admin    | 1        |
| User    | user1    | 1        |

## 7. Chức năng chính

### 👤 Người dùng

- **Xác thực đa dạng:** Đăng ký/đăng nhập thông thường, OAuth Google
- **Mua sắm thông minh:** Xem menu, đặt đồ uống với size và topping
- **Giỏ hàng real-time:** Quản lý giỏ hàng với cập nhật tức thì
- **Thanh toán đa kênh:** VNPay QR Code, COD, chuyển khoản
- **Theo dõi đơn hàng:** Real-time updates, tích hợp Giao Hàng Nhanh
- **Quản lý tài khoản:** Cập nhật thông tin, địa chỉ giao hàng, lịch sử đơn hàng
- **Voucher & Khuyến mãi:** Áp dụng voucher, theo dõi ưu đãi
- **Thông báo real-time:** Cập nhật trạng thái đơn hàng tức thì

### 🧑‍💼 Quản trị viên (Admin)

- **Dashboard tổng quan:** Thống kê doanh thu, đơn hàng, analytics real-time
- **Quản lý sản phẩm:** CRUD đồ uống, size, topping, nguyên liệu
- **Xử lý đơn hàng:** Xác nhận đơn, cập nhật trạng thái, tích hợp GHN
- **Quản lý người dùng:** Thông tin khách hàng, lịch sử mua hàng
- **Quản lý nhân viên:** Phân quyền, theo dõi hoạt động
- **Hệ thống voucher:** Tạo, chỉnh sửa voucher và chương trình khuyến mãi
- **Báo cáo chi tiết:** Doanh thu, sản phẩm bán chạy, khách hàng VIP
- **Bảo mật nâng cao:** Content Security Policy, monitoring violations

### 🚀 Tính năng nổi bật

#### 💳 Hệ thống thanh toán VNPay

- Thanh toán QR Code an toàn
- Xử lý callback tự động
- Verification chữ ký điện tử
- Support multiple payment methods

#### 🚚 Tích hợp Giao Hàng Nhanh (GHN)

- Tự động tạo đơn vận chuyển
- Theo dõi trạng thái giao hàng real-time
- Tính phí vận chuyển tự động
- Đồng bộ trạng thái delivery

#### 🔐 OAuth Google Authentication

- Đăng nhập nhanh với tài khoản Google
- Tự động sync thông tin profile
- Secure token management
- CSP compliance cho OAuth flows

#### ⚡ Real-time Updates

- Socket.IO integration
- Live order status updates
- Instant notifications
- Admin dashboard real-time

#### 🛡️ Bảo mật cao cấp

- Content Security Policy (CSP)
- Clickjacking protection
- XSS prevention
- CSRF protection
- Secure headers middleware

#### 📱 Responsive Design

- Mobile-first approach
- Progressive Web App ready
- Touch-friendly interface
- Cross-browser compatibility

## 8. Hình ảnh minh họa

### 👤 Người dùng

![Sản phẩm user ](./images/product.png)
![chi tiết Sản phẩm user ](./images/productdetail.png)
![Thanh toán user ](./images/checkout.jpg)
![Quản lý đơn hàng user ](./images/profile_order.png)

### 🧑‍💼 Quản trị viên (Admin)

![Trang chủ admin](./images/home_admin.jpg)
![Quản lý Sản phẩm admin ](./images/food_admin.jpg)
![Quản lý đơn hàng admin ](./images/order_admin.jpg)
![Quản lý Voucher admin](./images/voucher_admin.jpg)

### 👤 DEMO CSP

![Sản phẩm user ](./images/1.png)
![chi tiết Sản phẩm user ](./images/2.png)
![Quản lý đơn hàng user ](./images/3.png)

## 🛡️ Demo Content Security Policy (CSP)

Hệ thống SuLi Coffee tích hợp CSP để bảo vệ khỏi XSS và Clickjacking attacks.

### 📋 Test CSP Security

1. **Truy cập trang test:** `http://localhost:5000/csp_test.html`
2. **Mở Developer Tools (F12)**
3. **Chạy các test cases:**
   - ❌ Inline Script Attack (bị chặn)
   - ✅ Nonce Script (được phép)
   - ❌ External Malicious Resource (bị chặn)
   - 🛡️ Clickjacking Protection

### 🔧 CSP Configuration

```javascript
// CSP Directives được áp dụng:
'default-src': ["'self'"],
'script-src': ["'self'", "'nonce-xxx'", "https://accounts.google.com"],
'frame-ancestors': ["'none'"], // Chống Clickjacking
'connect-src': ["'self'", "https://www.googleapis.com"],
'form-action': ["'self'", "https://accounts.google.com"]
```

**📖 Chi tiết:** Xem file `readmedemoCSP.md` để được hướng dẫn từng bước

---

## 🔧 Technical Architecture

### 🏗️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │    │  Express API    │    │   PostgreSQL    │
│   (Frontend)    │◄──►│   (Backend)     │◄──►│   (Supabase)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         │              │   Socket.IO     │              │
         └──────────────►│  (Real-time)    │◄─────────────┘
                        └─────────────────┘
                                 │
                    ┌─────────────────────────────┐
                    │      External APIs          │
                    │  ┌─────────────────────┐   │
                    │  │     VNPay API       │   │
                    │  │  (Payment Gateway)  │   │
                    │  └─────────────────────┘   │
                    │  ┌─────────────────────┐   │
                    │  │      GHN API        │   │
                    │  │   (Shipping)        │   │
                    │  └─────────────────────┘   │
                    │  ┌─────────────────────┐   │
                    │  │    Google OAuth     │   │
                    │  │  (Authentication)   │   │
                    │  └─────────────────────┘   │
                    └─────────────────────────────┘
```

### 🔄 Data Flow

1. **User Authentication Flow**

   ```
   User → Google OAuth → JWT Token → Authenticated Requests
   ```

2. **Order Processing Flow**

   ```
   Cart → Checkout → VNPay → Payment Verification → Order Created → GHN Shipping
   ```

3. **Real-time Updates Flow**
   ```
   Admin Action → Database Update → Socket Emit → User Notification
   ```

### 📊 Database Schema Overview

```sql
-- Key Tables
Users (Id, FullName, Email, Username, Avatar, GoogleId)
Orders (OrderId, UserId, TotalAmount, StatusId, PaymentStatusId)
OrderDetails (OrderDetailId, OrderId, FoodId, Quantity, Price)
Food (FoodId, FoodName, Price, CategoryId, ImageUrl)
ShippingOrders (ShippingOrderId, OrderId, GHNOrderCode, Status)
```

---

## 📎 Deployment & Links

### 🚀 Production Deployment

- **Frontend:** Vercel/Netlify deployment ready
- **Backend:** Heroku/Railway compatible
- **Database:** Supabase PostgreSQL (cloud)
- **CDN:** Cloudinary for image storage

### 📎 Links

- 🔗 **Source Code:** [GitHub Repository](https://github.com/thlien20904/Suli_Coffee_Web)
- 🎥 **Video Demo:** [YouTube Demo](https://youtu.be/demo-link)
- 📖 **CSP Security Demo:** [CSP Documentation](./readmedemoCSP.md)
- 🏆 **Live Demo:** [SuLi Coffee Web App](https://suli-coffee.vercel.app)

## hi

2️⃣ Script 1: Inline không nonce, không hash (PHẢI bị chặn)
const s1 = document.createElement('script');
s1.textContent = "console.log('❌ BLOCKED'); alert('Should NOT show!');";
document.documentElement.appendChild(s1);

Kết quả mong đợi:

Console báo lỗi CSP: “Executing inline script violates …”

Alert không hiển thị ✅

3️⃣ Script 2: Inline có nonce đúng (PHẢI chạy)
const s2 = document.createElement('script');
s2.setAttribute('nonce', 'ABC123'); // Lấy từ CSP header
s2.textContent = "console.log('✅ NONCE works!'); alert('✅ NONCE Works!');";
document.documentElement.appendChild(s2);

Kết quả mong đợi:

Console: ✅ NONCE works!

Alert hiện: ✅

4️⃣ Script 3: Inline không nonce nhưng có hash đúng (PHẢI chạy)

Giả sử bạn muốn cho phép inline script:

console.log('✅ HASH works!'); alert('✅ HASH Works!');

Bạn tính hash SHA256 Base64 của script này trước. Ví dụ: sha256-q1w2e3r4t5y6u7i8o9p0a1s2d3f4g5h6j7k8l9m0=

const s3 = document.createElement('script');
s3.textContent = "console.log('✅ HASH works!'); alert('✅ HASH Works!');";
document.documentElement.appendChild(s3);

CSP sẽ cho phép chạy vì hash khớp.

5️⃣ Script sai hash hoặc nonce (PHẢI block)
const s4 = document.createElement('script');
s4.textContent = "console.log('❌ Wrong nonce/hash');";
document.documentElement.appendChild(s4);

Kết quả mong đợi:

CSP block, console báo lỗi

Script không chạy
