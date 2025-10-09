const express = require("express");
const router = express.Router();
const { poolPromise, sql } = require("../../db");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

// ✅ JWT Secret từ .env
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_fallback";

// 📌 ⚙️ Cấu hình upload file (sửa lại lưu vào public/images thay vì uploads/)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../../public/images");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const fileExt = path.extname(file.originalname).toLowerCase();
    const uniqueName = crypto.randomUUID() + fileExt;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// ✅ Middleware xác thực JWT
function authenticate(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Không có token xác thực!" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ success: false, message: "Token không hợp lệ!" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, role, username, ... }
    next();
  } catch (err) {
    console.error("JWT VERIFY ERROR:", err.message);
    return res.status(401).json({ success: false, message: "Token hết hạn hoặc không hợp lệ!" });
  }
}

// 📌 1. Lấy thông tin tài khoản
router.get("/", authenticate, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("Id", sql.Int, req.user.id)
      .query(
        "SELECT Id, Username, Email, FullName, Phone, Address, Role, AvatarUrl, CreatedDate FROM Users WHERE Id=@Id"
      );

    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy người dùng!" });
    }

    const user = result.recordset[0];
    res.json({ success: true, user });
  } catch (err) {
    console.error("PROFILE ERROR:", err);
    res.status(500).json({ success: false, message: "Lỗi server khi lấy thông tin user" });
  }
});

// 📌 2. Cập nhật thông tin user
router.post("/update", authenticate, async (req, res) => {
  try {
    const { id, field, value } = req.body;

    if (!value || value.trim() === "") {
      return res.json({ success: false, message: "Dữ liệu không được để trống!" });
    }

    // ✅ Kiểm tra quyền
    if (req.user.id !== parseInt(id) && req.user.role !== "admin") {
      return res.json({ success: false, message: "Bạn không có quyền chỉnh sửa!" });
    }

    const pool = await poolPromise;
    const userResult = await pool.request().input("Id", sql.Int, id).query("SELECT * FROM Users WHERE Id=@Id");
    if (userResult.recordset.length === 0) {
      return res.json({ success: false, message: "Không tìm thấy người dùng!" });
    }

    let query = "";
    switch (field) {
      case "Username":
        if (!/^[a-zA-Z0-9]{3,20}$/.test(value)) {
          return res.json({
            success: false,
            message: "Username phải từ 3-20 ký tự, chỉ chứa chữ và số!",
          });
        }
        query = "UPDATE Users SET Username=@Value WHERE Id=@Id";
        break;

      case "FullName":
        if (value.length < 3)
          return res.json({ success: false, message: "Tên quá ngắn!" });
        query = "UPDATE Users SET FullName=@Value WHERE Id=@Id";
        break;

      case "Email":
        if (
          !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value) ||
          value.length > 50
        ) {
          return res.json({
            success: false,
            message: "Email không hợp lệ hoặc quá dài!",
          });
        }
        query = "UPDATE Users SET Email=@Value WHERE Id=@Id";
        break;

      case "Phone":
        if (
          !/^(0[3|5|7|8|9])[0-9]{8}$/.test(value) ||
          value.length > 15
        ) {
          return res.json({
            success: false,
            message: "Số điện thoại không hợp lệ hoặc quá dài!",
          });
        }
        query = "UPDATE Users SET Phone=@Value WHERE Id=@Id";
        break;

      case "Address":
        if (value.length > 255)
          return res.json({ success: false, message: "Địa chỉ quá dài!" });
        query = "UPDATE Users SET Address=@Value WHERE Id=@Id";
        break;

      default:
        return res.json({ success: false, message: "Trường không hợp lệ!" });
    }

    await pool
      .request()
      .input("Id", sql.Int, id)
      .input("Value", sql.NVarChar(255), value.trim())
      .query(query);

    res.json({ success: true, message: "Cập nhật thành công!" });
  } catch (err) {
    console.error("UPDATE USER ERROR:", err);
    res.status(500).json({ success: false, message: "Có lỗi xảy ra khi cập nhật." });
  }
});

// 📌 3. ⚙️ Upload avatar (đã fix logic rename + đường dẫn)
router.post("/avatar", authenticate, upload.single("AvatarFile"), async (req, res) => {
  try {
    const { id } = req.body;
    const file = req.file;

    if (!file || file.length === 0) {
      return res.status(400).json({ success: false, message: "Vui lòng chọn một file ảnh!" });
    }

    const fileExt = path.extname(file.originalname).toLowerCase();
    const allowedExts = [".png", ".jpg", ".jpeg", ".gif", ".webp"];
    if (!allowedExts.includes(fileExt)) {
      // Xóa file nếu extension không hợp lệ
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      return res.status(400).json({ success: false, message: "Chỉ chấp nhận file ảnh (.png, .jpg, .jpeg, .gif, .webp)." });
    }

    // ✅ Kiểm tra quyền
    if (req.user.id !== parseInt(id) && req.user.role !== "admin") {
      // Xóa file nếu không có quyền
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      return res.status(403).json({ success: false, message: "Bạn không có quyền chỉnh sửa!" });
    }

    const pool = await poolPromise;
    const userResult = await pool.request().input("Id", sql.Int, id).query("SELECT * FROM Users WHERE Id=@Id");
    if (userResult.recordset.length === 0) {
      // Xóa file nếu không tìm thấy user
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      return res.status(404).json({ success: false, message: "Không tìm thấy người dùng!" });
    }

    const user = userResult.recordset[0];

    // ✅ Xóa avatar cũ nếu có
    if (user.AvatarUrl && user.AvatarUrl.trim() !== "") {
      const oldFilePath = path.join(__dirname, "../../public", user.AvatarUrl);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    // ✅ Update DB: AvatarUrl = /images/filename
    const avatarUrl = `/images/${file.filename}`;
    await pool
      .request()
      .input("Id", sql.Int, id)
      .input("AvatarUrl", sql.NVarChar(255), avatarUrl)
      .query("UPDATE Users SET AvatarUrl=@AvatarUrl WHERE Id=@Id");

    res.json({
      success: true,
      message: "Cập nhật ảnh đại diện thành công!",
      avatarUrl,
    });
  } catch (err) {
    console.error("AVATAR ERROR:", err);
    // ⚙️ Xóa file tạm nếu lỗi
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res
      .status(500)
      .json({ success: false, message: "Lỗi khi cập nhật ảnh đại diện: " + err.message });
  }
});

// 📌 4. Lấy danh sách đơn hàng
router.get("/orders", authenticate, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 5;
    const tab = req.query.tab || "cho-xac-nhan";

    const userId = req.user.id;

    let query = `
      SELECT o.*, p.TenPhuongThuc, s.StatusName
      FROM Orders o
      LEFT JOIN PhuongThucThanhToan p ON o.PaymentMethodId = p.Id
      LEFT JOIN OrderStatus s ON o.StatusId = s.StatusId
      WHERE o.UserId = @UserId
    `;

    switch (tab) {
      case "cho-xac-nhan":
        query += " AND o.StatusId = 1";
        break;
      case "dang-chuan-bi":
        query += " AND o.StatusId = 2";
        break;
      case "dang-giao-hang":
        query += " AND o.StatusId = 3";
        break;
      case "da-giao":
        query += " AND o.StatusId = 4";
        break;
      case "da-huy":
        query += " AND o.StatusId = 5";
        break;
    }

    const pool = await poolPromise;
    const result = await pool.request().input("UserId", sql.Int, userId).query(query);

    const totalOrders = result.recordset.length;
    const paginated = result.recordset.slice((page - 1) * pageSize, page * pageSize);

    res.json({
      success: true,
      orders: paginated,
      totalOrders,
      currentPage: page,
      pageSize,
      totalPages: Math.ceil(totalOrders / pageSize),
    });
  } catch (err) {
    console.error("ORDERS ERROR:", err);
    res.status(500).json({ success: false, message: "Có lỗi khi lấy danh sách đơn hàng." });
  }
});

// 📌 5. Hủy đơn hàng
router.post("/orders/cancel", authenticate, async (req, res) => {
  try {
    const { orderId } = req.body;
    const userId = req.user.id;

    const pool = await poolPromise;

    const orderResult = await pool
      .request()
      .input("OrderId", sql.Int, orderId)
      .input("UserId", sql.Int, userId)
      .query("SELECT * FROM Orders WHERE OrderId = @OrderId AND UserId = @UserId");

    if (orderResult.recordset.length === 0) {
      return res.json({ success: false, message: "Không tìm thấy đơn hàng hoặc không có quyền hủy!" });
    }
    const order = orderResult.recordset[0];

    if (order.StatusId !== 1 && order.StatusId !== 2) {
      return res.json({ success: false, message: "Không thể hủy đơn hàng ở trạng thái hiện tại!" });
    }

    await pool
      .request()
      .input("OrderId", sql.Int, orderId)
      .query("UPDATE Orders SET StatusId = 5 WHERE OrderId = @OrderId");

    res.json({ success: true, message: "Hủy đơn hàng thành công!" });
  } catch (err) {
    console.error("CANCEL ORDER ERROR:", err);
    res.status(500).json({ success: false, message: "Có lỗi xảy ra khi hủy đơn hàng." });
  }
});

module.exports = router;