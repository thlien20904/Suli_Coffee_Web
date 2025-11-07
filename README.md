# ☕ SuLi Coffee Web Application

## 1. Giới thiệu

**SuLi Coffee** là ứng dụng web quản lý và đặt đồ uống trực tuyến.
Hệ thống cho phép **khách hàng** đặt đồ uống, theo dõi đơn hàng, quản lý thông tin cá nhân và **admin** có thể quản lý toàn bộ hoạt động của cửa hàng như sản phẩm, nhân viên, đơn hàng và báo cáo.

## 2. Công nghệ sử dụng

### 🖥️ Frontend

- React.js
- Redux (quản lý state)
- CSS Modules
- Axios (gọi API)

### ⚙️ Backend

- Node.js + Express.js
- Sequelize ORM (kết nối SQL Server)
- JWT (xác thực người dùng)
- Multer (upload hình ảnh)
- Bcrypt (mã hóa mật khẩu)

### 🗄️ Database

- Microsoft SQL Server

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
DB_NAME=WebAppDB
DB_USER=sa
DB_PASSWORD=123456
DB_HOST=localhost
DB_PORT=1433
JWT_SECRET=your_jwt_secret

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

- Đăng ký / Đăng nhập
- Xem menu xem cửa hàng và đặt đồ uống
- Quản lý giỏ hàng
- Theo dõi đơn hàng
- Cập nhật thông tin cá nhân, nhận voucher

### 🧑‍💼 Quản trị viên (Admin)

- Quản lý sản phẩm, nguyên liệu, phương thức thanh toán (CRUD)
- Quản lý đơn hàng, nhân viên, người dùng, voucher
- Thống kê và báo cáo doanh thu

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

## ✨ 9. Tác giả

| Họ và tên              | MSSV        |
| ---------------------- | ----------- |
| 💠 **Điêu Thúy Liên**  | 22810310267 |
| 💠 **Phạm Đăng Khuê**  | 22810310270 |
| 💠 **Nguyễn Đức Minh** | 22810310235 |

## 📎 Link nộp bài

- 🔗 Source Code + Database (GitHub Public):
  [https://github.com/dieuthulien/QuanLyQuanCafe](https://github.com/dieuthulien/QuanLyQuanCafe)

- 🎥 Video Demo (YouTube – Không công khai):
  [https://youtu.be/](https://youtu.be/ZksVXJf6EvM)
