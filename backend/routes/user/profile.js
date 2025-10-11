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
    return res
      .status(401)
      .json({ success: false, message: "Không có token xác thực!" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Token không hợp lệ!" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, role, username, ... }
    next();
  } catch (err) {
    console.error("JWT VERIFY ERROR:", err.message);
    return res
      .status(401)
      .json({ success: false, message: "Token hết hạn hoặc không hợp lệ!" });
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
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy người dùng!" });
    }

    const user = result.recordset[0];
    res.json({ success: true, user });
  } catch (err) {
    console.error("PROFILE ERROR:", err);
    res
      .status(500)
      .json({ success: false, message: "Lỗi server khi lấy thông tin user" });
  }
});
// 📌 2. Cập nhật thông tin user (gộp avatar vào)
router.post(
  "/update",
  authenticate,
  upload.single("AvatarFile"),
  async (req, res) => {
    try {
      const { id, FullName, Phone, Address } = req.body;
      const file = req.file;

      // ⚙️ Kiểm tra quyền
      if (req.user.id !== parseInt(id) && req.user.role !== "admin") {
        if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
        return res
          .status(403)
          .json({ success: false, message: "Bạn không có quyền chỉnh sửa!" });
      }

      const pool = await poolPromise;

      const userResult = await pool
        .request()
        .input("Id", sql.Int, id)
        .query("SELECT * FROM Users WHERE Id=@Id");

      if (userResult.recordset.length === 0) {
        if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
        return res
          .status(404)
          .json({ success: false, message: "Không tìm thấy người dùng!" });
      }

      const user = userResult.recordset[0];

      // ================= VALIDATE =================
      const errors = {};
      if (!FullName || FullName.trim().length < 3)
        errors.FullName = "FullName phải ≥ 3 ký tự";
      if (!Phone || !/^(0[3|5|7|8|9])[0-9]{8,9}$/.test(Phone.trim()))
        errors.Phone = "Số điện thoại không hợp lệ (9-10 số)";
      if (!Address || Address.trim().length === 0)
        errors.Address = "Address không được để trống";

      // Validate avatar nếu có
      let avatarUrl = user.AvatarUrl || "";
      if (file) {
        const allowedExts = [".png", ".jpg", ".jpeg", ".gif", ".webp"];
        const ext = path.extname(file.originalname).toLowerCase();
        if (!allowedExts.includes(ext)) {
          fs.unlinkSync(file.path);
          return res.status(400).json({
            success: false,
            message: "Chỉ chấp nhận file ảnh (.png, .jpg, .jpeg, .gif, .webp).",
          });
        }
      }

      if (Object.keys(errors).length > 0) {
        if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
        return res
          .status(400)
          .json({ success: false, message: Object.values(errors).join("\n") });
      }

      // ================= XỬ LÝ AVATAR =================
      if (file) {
        // Xóa avatar cũ nếu có
        if (user.AvatarUrl && user.AvatarUrl.trim() !== "") {
          const oldPath = path.join(__dirname, "../../public", user.AvatarUrl);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }
        avatarUrl = `/images/${file.filename}`;
      }

      // ================= UPDATE DB =================
      await pool
        .request()
        .input("Id", sql.Int, id)
        .input("FullName", sql.NVarChar(255), FullName.trim())
        .input("Phone", sql.NVarChar(20), Phone.trim())
        .input("Address", sql.NVarChar(255), Address.trim())
        .input("AvatarUrl", sql.NVarChar(255), avatarUrl).query(`
        UPDATE Users SET
          FullName=@FullName,
          Phone=@Phone,
          Address=@Address,
          AvatarUrl=@AvatarUrl
        WHERE Id=@Id
      `);

      return res.json({
        success: true,
        message: "Cập nhật thành công!",
        avatarUrl,
      });
    } catch (err) {
      console.error("UPDATE USER ERROR:", err);
      if (req.file && fs.existsSync(req.file.path))
        fs.unlinkSync(req.file.path);
      res
        .status(500)
        .json({ success: false, message: "Có lỗi xảy ra khi cập nhật." });
    }
  }
);
// 3 📌 Lấy danh sách đơn hàng theo tab + phân trang
router.get("/orders", authenticate, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 5;
    const tab = req.query.tab || "cho-xac-nhan";
    const userId = req.user.id;

    const pool = await poolPromise;

    // Map tab sang StatusId
    const tabStatusMap = {
      "cho-xac-nhan": 1,
      "dang-chuan-bi": 2,
      "dang-giao-hang": 3,
      "da-giao": 4,
      "da-huy": 5,
    };
    const statusId = tabStatusMap[tab] || 1;

    // 1️⃣ Lấy tổng số đơn hàng của tab này (dùng COUNT)
    const totalResult = await pool
      .request()
      .input("UserId", sql.Int, userId)
      .input("StatusId", sql.Int, statusId)
      .query(
        `SELECT COUNT(*) AS Total
         FROM Orders
         WHERE UserId = @UserId AND StatusId = @StatusId`
      );
    const totalOrders = totalResult.recordset[0].Total;

    // 2️⃣ Lấy đơn hàng theo trang (ORDER BY OrderDate DESC)
    const ordersResult = await pool
      .request()
      .input("UserId", sql.Int, userId)
      .input("StatusId", sql.Int, statusId)
      .input("Offset", sql.Int, (page - 1) * pageSize)
      .input("PageSize", sql.Int, pageSize).query(`
        SELECT o.OrderId, o.OrderDate, o.TotalAmount, o.StatusId, o.PaymentMethodId,
               p.TenPhuongThuc AS PaymentMethod,
               s.StatusName
        FROM Orders o
        LEFT JOIN PhuongThucThanhToan p ON o.PaymentMethodId = p.Id
        LEFT JOIN OrderStatus s ON o.StatusId = s.StatusId
        WHERE o.UserId = @UserId AND o.StatusId = @StatusId
        ORDER BY o.OrderDate DESC
        OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY
      `);

    // 3️⃣ Lấy chi tiết order (OrderDetails) cho tất cả đơn hàng
    const orderIds = ordersResult.recordset.map((o) => o.OrderId);
    let detailsMap = {};
    if (orderIds.length > 0) {
      const detailsResult = await pool
        .request()
        .input("OrderIds", sql.NVarChar, orderIds.join(",")).query(`
          SELECT od.OrderId, od.Quantity, od.Price,
                 f.FoodName, s.SizeName, t.ToppingName
          FROM OrderDetails od
          LEFT JOIN Food f ON od.FoodId = f.FoodId
          LEFT JOIN Size s ON od.SizeId = s.SizeID
          LEFT JOIN Topping t ON od.ToppingId = t.ToppingID
          WHERE od.OrderId IN (${orderIds.join(",")})
        `);

      detailsResult.recordset.forEach((d) => {
        if (!detailsMap[d.OrderId]) detailsMap[d.OrderId] = [];
        detailsMap[d.OrderId].push({
          FoodName: d.FoodName || "Không xác định",
          SizeName: d.SizeName || null,
          ToppingName: d.ToppingName || null,
          Quantity: d.Quantity,
          Price: d.Price,
        });
      });
    }

    // 4️⃣ Kết hợp Order + OrderDetails
    const ordersWithDetails = ordersResult.recordset.map((o) => ({
      OrderId: o.OrderId,
      OrderDate: o.OrderDate,
      TotalAmount: o.TotalAmount,
      StatusId: o.StatusId,
      Status: o.StatusName,
      PaymentMethod: o.PaymentMethod || "Không xác định",
      OrderDetails: detailsMap[o.OrderId] || [],
    }));

    res.json({
      success: true,
      orders: ordersWithDetails,
      totalOrders,
      currentPage: page,
      pageSize,
      totalPages: Math.ceil(totalOrders / pageSize),
    });
  } catch (err) {
    console.error("ORDERS ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi lấy danh sách đơn hàng.",
    });
  }
});

// 4📌 Hủy đơn hàng
router.post("/orders/cancel", authenticate, async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId)
      return res.json({ success: false, message: "Thiếu orderId!" });

    const userId = req.user.id;

    const pool = await poolPromise;

    // Lấy đơn hàng
    const orderResult = await pool
      .request()
      .input("OrderId", sql.Int, orderId)
      .input("UserId", sql.Int, userId)
      .query(
        "SELECT * FROM Orders WHERE OrderId = @OrderId AND UserId = @UserId"
      );

    if (orderResult.recordset.length === 0) {
      return res.json({
        success: false,
        message: "Không tìm thấy đơn hàng hoặc không có quyền hủy!",
      });
    }

    const order = orderResult.recordset[0];

    // Chỉ cho phép hủy nếu StatusId = 1 hoặc 2
    if (![1, 2].includes(order.StatusId)) {
      return res.json({
        success: false,
        message: "Không thể hủy đơn hàng ở trạng thái hiện tại!",
      });
    }

    // Cập nhật trạng thái sang "Đã hủy"
    const updateResult = await pool
      .request()
      .input("OrderId", sql.Int, orderId)
      .input("NewStatus", sql.Int, 5) // StatusId = 5 = Đã hủy
      .query(
        "UPDATE Orders SET StatusId = @NewStatus WHERE OrderId = @OrderId"
      );

    return res.json({ success: true, message: "Hủy đơn hàng thành công!" });
  } catch (err) {
    console.error("CANCEL ORDER ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi hủy đơn hàng: " + err.message,
    });
  }
});

// 📌 Lấy avatar hiện tại
router.get("/avatar", authenticate, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("Id", sql.Int, req.user.id)
      .query("SELECT AvatarUrl FROM Users WHERE Id=@Id");

    if (result.recordset.length === 0)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy người dùng!" });

    const avatar = result.recordset[0].AvatarUrl;
    res.json({ success: true, avatarUrl: avatar });
  } catch (err) {
    console.error("GET AVATAR ERROR:", err);
    res.status(500).json({ success: false, message: "Lỗi khi lấy avatar" });
  }
});

/* =====================================================
   📦 VOUCHERS DÀNH CHO NGƯỜI DÙNG
===================================================== */

// 1️⃣ Lấy danh sách voucher đang hoạt động
router.get("/vouchers", authenticate, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT VoucherId, Code, DiscountAmount, DiscountPercentage, 
             MinOrderAmount, ExpiryDate, Description, MaxUsage, UsedCount
      FROM Vouchers
      WHERE IsActive = 1 AND ExpiryDate > GETDATE()
      ORDER BY CreatedDate DESC
    `);

    res.json({ success: true, vouchers: result.recordset });
  } catch (err) {
    console.error("GET VOUCHERS ERROR:", err);
    res
      .status(500)
      .json({ success: false, message: "Lỗi khi lấy danh sách voucher." });
  }
});

// 2️⃣ Người dùng nhận voucher
router.post("/vouchers/receive", authenticate, async (req, res) => {
  try {
    const { voucherId } = req.body;
    const userId = req.user.id;
    if (!voucherId)
      return res.json({ success: false, message: "Thiếu voucherId!" });

    const pool = await poolPromise;

    // Kiểm tra voucher hợp lệ
    const voucher = await pool
      .request()
      .input("VoucherId", sql.Int, voucherId)
      .query(
        "SELECT * FROM Vouchers WHERE VoucherId=@VoucherId AND IsActive=1 AND ExpiryDate>GETDATE()"
      );

    if (voucher.recordset.length === 0)
      return res.json({
        success: false,
        message: "Voucher không hợp lệ hoặc đã hết hạn!",
      });

    // Kiểm tra đã nhận chưa
    const exist = await pool
      .request()
      .input("UserId", sql.Int, userId)
      .input("VoucherId", sql.Int, voucherId)
      .query(
        "SELECT * FROM UserVouchers WHERE UserId=@UserId AND VoucherId=@VoucherId"
      );

    if (exist.recordset.length > 0)
      return res.json({
        success: false,
        message: "Bạn đã nhận voucher này rồi!",
      });

    // Thêm vào UserVouchers
    await pool
      .request()
      .input("UserId", sql.Int, userId)
      .input("VoucherId", sql.Int, voucherId)
      .query(
        "INSERT INTO UserVouchers (UserId, VoucherId, IsUsed) VALUES (@UserId, @VoucherId, 0)"
      );

    res.json({ success: true, message: "Nhận voucher thành công!" });
  } catch (err) {
    console.error("RECEIVE VOUCHER ERROR:", err);
    res.status(500).json({ success: false, message: "Lỗi khi nhận voucher." });
  }
});

// 3️⃣ Lấy danh sách voucher người dùng đã nhận
router.get("/vouchers/my", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const pool = await poolPromise;

    const result = await pool.request().input("UserId", sql.Int, userId).query(`
        SELECT uv.UserVoucherId, v.Code, v.Description, v.DiscountAmount, v.DiscountPercentage, 
               v.MinOrderAmount, v.ExpiryDate, uv.IsUsed, uv.ReceivedDate
        FROM UserVouchers uv
        JOIN Vouchers v ON uv.VoucherId = v.VoucherId
        WHERE uv.UserId = @UserId
        ORDER BY uv.ReceivedDate DESC
      `);

    res.json({ success: true, vouchers: result.recordset });
  } catch (err) {
    console.error("GET USER VOUCHERS ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách voucher của bạn.",
    });
  }
});

/* =====================================================
   🔔 NOTIFICATIONS - Hệ thống thông báo người dùng
===================================================== */

// 📋 Lấy danh sách thông báo
router.get("/notifications", authenticate, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 4;
    const offset = (page - 1) * pageSize;

    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("UserId", sql.Int, req.user.id)
      .input("Offset", sql.Int, offset)
      .input("PageSize", sql.Int, pageSize).query(`
        SELECT NotificationId, Title, Message, IsRead, CreatedAt
        FROM Notifications
        WHERE UserId=@UserId
        ORDER BY CreatedAt DESC
        OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
      `);

    // Đếm tổng số thông báo để tính tổng số trang
    const total = await pool
      .request()
      .input("UserId", sql.Int, req.user.id)
      .query(
        `SELECT COUNT(*) AS total FROM Notifications WHERE UserId=@UserId`
      );

    res.json({
      success: true,
      notifications: result.recordset,
      total: total.recordset[0].total,
    });
  } catch (err) {
    console.error("GET NOTIFICATIONS ERROR:", err);
    res
      .status(500)
      .json({ success: false, message: "Lỗi khi lấy danh sách thông báo." });
  }
});

// ✅ Đánh dấu đã đọc
router.post("/notifications/read", authenticate, async (req, res) => {
  try {
    const { notificationId } = req.body;
    if (!notificationId)
      return res.json({ success: false, message: "Thiếu notificationId!" });

    const pool = await poolPromise;
    await pool
      .request()
      .input("NotificationId", sql.Int, notificationId)
      .input("UserId", sql.Int, req.user.id)
      .query(
        "UPDATE Notifications SET IsRead=1 WHERE NotificationId=@NotificationId AND UserId=@UserId"
      );

    res.json({ success: true, message: "Đã đánh dấu là đã đọc!" });
  } catch (err) {
    console.error("READ NOTIFICATION ERROR:", err);
    res
      .status(500)
      .json({ success: false, message: "Lỗi khi cập nhật thông báo." });
  }
});

// ✅ Đánh dấu tất cả đã đọc
router.post("/notifications/read-all", authenticate, async (req, res) => {
  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("UserId", sql.Int, req.user.id)
      .query("UPDATE Notifications SET IsRead=1 WHERE UserId=@UserId");

    res.json({
      success: true,
      message: "Đã đánh dấu tất cả thông báo là đã đọc!",
    });
  } catch (err) {
    console.error("READ ALL NOTIFICATIONS ERROR:", err);
    res
      .status(500)
      .json({ success: false, message: "Lỗi khi cập nhật tất cả thông báo." });
  }
});
// 🗑️ Xóa 1 thông báo
router.delete("/notifications/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;

    const result = await pool
      .request()
      .input("NotificationId", sql.Int, id)
      .input("UserId", sql.Int, req.user.id).query(`
        DELETE FROM Notifications
        WHERE NotificationId=@NotificationId AND UserId=@UserId
      `);

    if (result.rowsAffected[0] === 0)
      return res.json({ success: false, message: "Không tìm thấy thông báo." });

    res.json({ success: true, message: "Đã xóa thông báo thành công!" });
  } catch (err) {
    console.error("DELETE NOTIFICATION ERROR:", err);
    res.status(500).json({ success: false, message: "Lỗi khi xóa thông báo." });
  }
});

module.exports = router;
