const sequelize = require("../../config/sequelize");
const initModels = require("../../models/init-models");
const models = initModels(sequelize);
const {
  Users,
  Orders,
  OrderDetails,
  PhuongThucThanhToan,
  OrderStatus,
  Food,
  Size,
  Topping,
  Vouchers,
  UserVouchers,
  Notifications,
} = models;
const { Op } = require("sequelize");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

// JWT Secret từ .env
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_fallback";

// Cấu hình upload file
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

// Middleware xác thực JWT
const authenticate = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  console.log("🟢 AUTH HEADER:", authHeader); // ✅ log header nhận được

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("❌ Không có header hoặc sai định dạng");
    return res
      .status(401)
      .json({ success: false, message: "Không có token xác thực!" });
  }

  const token = authHeader.split(" ")[1];
  console.log("🟡 TOKEN NHẬN ĐƯỢC:", token); // ✅ log token

  if (!token) {
    console.log("❌ Token trống");
    return res
      .status(401)
      .json({ success: false, message: "Token không hợp lệ!" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log("✅ TOKEN DECODED:", decoded); // ✅ log payload token
    req.user = decoded; // { id, role, username, ... }
    next();
  } catch (err) {
    console.error("🔴 JWT VERIFY ERROR:", err.message);
    return res
      .status(401)
      .json({ success: false, message: "Token hết hạn hoặc không hợp lệ!" });
  }
};

// =========================
// 📌 LẤY THÔNG TIN TÀI KHOẢN
// =========================
const getProfile = async (req, res) => {
  try {
    console.log("🟢 REQ.USER:", req.user);
    const userId = req.user.id;
    console.log("🟡 Đang truy vấn userId:", userId);
    const user = await Users.findByPk(userId, {
      attributes: [
        "Id",
        "Username",
        "Email",
        "FullName",
        "Phone",
        "Address",
        "Role",
        "AvatarUrl",
        "CreatedDate",
      ],
    });
    if (!user) {
      console.log("❌ Không tìm thấy user với Id:", userId);
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy người dùng!" });
    }
    console.log("✅ USER FOUND:", user.toJSON());
    res.json({ success: true, data: user });
  } catch (err) {
    console.error("🔴 PROFILE ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy thông tin user",
      detail: err.message,
    });
  }
};

// =========================
// 📌 CẬP NHẬT THÔNG TIN USER
// =========================
// updateProfile
const updateProfile = async (req, res) => {
  try {
    const { id, FullName, Phone, Address } = req.body;
    const file = req.file;

    if (req.user.id !== parseInt(id) && req.user.role !== "admin") {
      if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res
        .status(403)
        .json({ success: false, message: "Bạn không có quyền chỉnh sửa!" });
    }

    const user = await Users.findByPk(id);
    if (!user) {
      if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy người dùng!" });
    }

    // Validate input
    const errors = {};
    if (!FullName || FullName.trim().length < 3)
      errors.FullName = "FullName phải ≥ 3 ký tự";
    if (!Phone || !/^(0[3|5|7|8|9])[0-9]{8,9}$/.test(Phone.trim()))
      errors.Phone = "Số điện thoại không hợp lệ (9-10 số)";
    if (!Address || Address.trim().length === 0)
      errors.Address = "Address không được để trống";

    if (Object.keys(errors).length > 0) {
      if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res
        .status(400)
        .json({ success: false, message: Object.values(errors).join("\n") });
    }

    // Xử lý avatar
    let avatarUrl = user.AvatarUrl || "";
    if (file) {
      if (user.AvatarUrl && user.AvatarUrl.trim() !== "") {
        const oldPath = path.join(__dirname, "../../public", user.AvatarUrl);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      avatarUrl = `/images/${file.filename.replace(/\\/g, "/")}`;
    }

    // Update instance
    user.FullName = FullName.trim();
    user.Phone = Phone.trim();
    user.Address = Address.trim();
    user.AvatarUrl = avatarUrl;

    await user.save();

    res.json({
      success: true,
      message: "Cập nhật thành công!",
      data: { avatarUrl },
    });
  } catch (err) {
    console.error("UPDATE USER ERROR:", err);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res
      .status(500)
      .json({ success: false, message: "Có lỗi xảy ra khi cập nhật." });
  }
};

// =========================
// 📌 LẤY DANH SÁCH ĐƠN HÀNG THEO TAB + PHÂN TRANG
// =========================
const getOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 5;
    const tab = req.query.tab || "cho-xac-nhan";
    const userId = req.user.id;

    // Map tab sang StatusId
    const tabStatusMap = {
      "cho-xac-nhan": 1,
      "dang-chuan-bi": 2,
      "dang-giao-hang": 3,
      "da-giao": 4,
      "da-huy": 5,
    };
    const statusId = tabStatusMap[tab] || 1;

    // Lấy tổng số đơn hàng
    const totalOrders = await Orders.count({
      where: { UserId: userId, StatusId: statusId },
    });

    // Lấy đơn hàng theo trang
    const orders = await Orders.findAll({
      where: { UserId: userId, StatusId: statusId },
      order: [["OrderDate", "DESC"]],
      offset: (page - 1) * pageSize,
      limit: pageSize,
      attributes: [
        "OrderId",
        "OrderDate",
        "TotalAmount",
        "StatusId",
        "PaymentMethodId",
      ],
      include: [
        {
          model: PhuongThucThanhToan,
          as: "PaymentMethod", // ✅ đúng alias
          attributes: ["TenPhuongThuc"],
        },
        {
          model: OrderStatus,
          as: "Status", // ✅ đúng alias
          attributes: ["StatusName"],
        },
      ],
    });

    // Lấy chi tiết đơn hàng
    const orderIds = orders.map((o) => o.OrderId);
    let detailsMap = {};
    if (orderIds.length > 0) {
      const details = await OrderDetails.findAll({
        where: { OrderId: { [Op.in]: orderIds } },
        include: [
          { model: Food, as: "Food", attributes: ["FoodName"] },
          { model: Size, as: "Size", attributes: ["SizeName"] },
          { model: Topping, as: "Topping", attributes: ["ToppingName"] },
        ],
      });

      details.forEach((d) => {
        if (!detailsMap[d.OrderId]) detailsMap[d.OrderId] = [];
        detailsMap[d.OrderId].push({
          FoodName: d.Food?.FoodName || "Không xác định",
          SizeName: d.Size?.SizeName || null,
          ToppingName: d.Topping?.ToppingName || null,
          Quantity: d.Quantity,
          Price: parseFloat(d.Price),
        });
      });
    }

    // Kết hợp Order + OrderDetails
    const ordersWithDetails = orders.map((o) => ({
      OrderId: o.OrderId,
      OrderDate: o.OrderDate,
      TotalAmount: parseFloat(o.TotalAmount),
      StatusId: o.StatusId,
      Status: o.Status?.StatusName || "Không xác định",
      PaymentMethod: o.PaymentMethod?.TenPhuongThuc || "Không xác định",
      OrderDetails: detailsMap[o.OrderId] || [],
    }));

    res.json({
      success: true,
      data: {
        orders: ordersWithDetails,
        totalOrders,
        currentPage: page,
        pageSize,
        totalPages: Math.ceil(totalOrders / pageSize),
      },
    });
  } catch (err) {
    console.error("ORDERS ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi lấy danh sách đơn hàng.",
    });
  }
};

// =========================
// 📌 HỦY ĐƠN HÀNG
// =========================
const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.json({ success: false, message: "Thiếu orderId!" });
    }

    const userId = req.user.id;
    const order = await Orders.findOne({
      where: { OrderId: orderId, UserId: userId },
    });

    if (!order) {
      return res.json({
        success: false,
        message: "Không tìm thấy đơn hàng hoặc không có quyền hủy!",
      });
    }

    if (![1, 2].includes(order.StatusId)) {
      return res.json({
        success: false,
        message: "Không thể hủy đơn hàng ở trạng thái hiện tại!",
      });
    }

    await order.update({ StatusId: 5 }); // StatusId = 5 = Đã hủy

    res.json({ success: true, message: "Hủy đơn hàng thành công!" });
  } catch (err) {
    console.error("CANCEL ORDER ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi hủy đơn hàng: " + err.message,
    });
  }
};

// =========================
// 📌 LẤY AVATAR HIỆN TẠI
// =========================
const getAvatar = async (req, res) => {
  try {
    const user = await Users.findByPk(req.user.id, {
      attributes: ["AvatarUrl"],
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy người dùng!" });
    }

    res.json({ success: true, data: { avatarUrl: user.AvatarUrl } });
  } catch (err) {
    console.error("GET AVATAR ERROR:", err);
    res.status(500).json({ success: false, message: "Lỗi khi lấy avatar" });
  }
};

// =========================
// 📌 LẤY DANH SÁCH VOUCHER ĐANG HOẠT ĐỘNG
// =========================
const getVouchers = async (req, res) => {
  try {
    const vouchers = await Vouchers.findAll({
      where: {
        IsActive: true,
        ExpiryDate: { [Op.gt]: sequelize.fn("getdate") },
      },
      attributes: [
        "VoucherId",
        "Code",
        "DiscountAmount",
        "DiscountPercentage",
        "MinOrderAmount",
        "ExpiryDate",
        "Description",
        "MaxUsage",
        "UsedCount",
      ],
      order: [["CreatedDate", "DESC"]],
    });

    res.json({ success: true, data: vouchers });
  } catch (err) {
    console.error("GET VOUCHERS ERROR:", err);
    res
      .status(500)
      .json({ success: false, message: "Lỗi khi lấy danh sách voucher." });
  }
};

// =========================
// 📌 NGƯỜI DÙNG NHẬN VOUCHER
// =========================
const receiveVoucher = async (req, res) => {
  try {
    const { voucherId } = req.body;
    const userId = req.user.id;
    if (!voucherId) {
      return res.json({ success: false, message: "Thiếu voucherId!" });
    }

    const voucher = await Vouchers.findOne({
      where: {
        VoucherId: voucherId,
        IsActive: true,
        ExpiryDate: { [Op.gt]: sequelize.fn("getdate") },
      },
    });

    if (!voucher) {
      return res.json({
        success: false,
        message: "Voucher không hợp lệ hoặc đã hết hạn!",
      });
    }

    const existingVoucher = await UserVouchers.findOne({
      where: { UserId: userId, VoucherId: voucherId },
    });

    if (existingVoucher) {
      return res.json({
        success: false,
        message: "Bạn đã nhận voucher này rồi!",
      });
    }

    await UserVouchers.create({
      UserId: userId,
      VoucherId: voucherId,
      IsUsed: false,
    });

    res.json({ success: true, message: "Nhận voucher thành công!" });
  } catch (err) {
    console.error("RECEIVE VOUCHER ERROR:", err);
    res.status(500).json({ success: false, message: "Lỗi khi nhận voucher." });
  }
};

// =========================
// 📌 LẤY DANH SÁCH VOUCHER ĐÃ NHẬN
// =========================
const getUserVouchers = async (req, res) => {
  try {
    const userId = req.user.id;
    const vouchers = await UserVouchers.findAll({
      where: { UserId: userId },
      include: [
        {
          model: Vouchers,
          as: "Voucher",
          attributes: [
            "Code",
            "Description",
            "DiscountAmount",
            "DiscountPercentage",
            "MinOrderAmount",
            "ExpiryDate",
          ],
        },
      ],
      order: [["ReceivedDate", "DESC"]],
      attributes: ["UserVoucherId", "IsUsed", "ReceivedDate"],
    });

    const formattedVouchers = vouchers.map((uv) => ({
      UserVoucherId: uv.UserVoucherId,
      Code: uv.Voucher?.Code,
      Description: uv.Voucher?.Description,
      DiscountAmount: uv.Voucher?.DiscountAmount
        ? parseFloat(uv.Voucher.DiscountAmount)
        : null,
      DiscountPercentage: uv.Voucher?.DiscountPercentage
        ? parseFloat(uv.Voucher.DiscountPercentage)
        : null,
      MinOrderAmount: uv.Voucher?.MinOrderAmount
        ? parseFloat(uv.Voucher.MinOrderAmount)
        : null,
      ExpiryDate: uv.Voucher?.ExpiryDate,
      IsUsed: uv.IsUsed,
      ReceivedDate: uv.ReceivedDate,
    }));

    res.json({ success: true, data: formattedVouchers });
  } catch (err) {
    console.error("GET USER VOUCHERS ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách voucher của bạn.",
    });
  }
};
// 📌 Áp dụng voucher vào đơn hàng
const applyVoucher = async (req, res) => {
  try {
    const { voucherCode, subtotal } = req.body; // sửa từ code -> voucherCode
    const userId = req.user.id;

    if (!voucherCode) {
      return res
        .status(400)
        .json({ success: false, message: "Thiếu mã voucher!" });
    }

    // Kiểm tra voucher tồn tại
    const voucher = await Vouchers.findOne({
      where: {
        Code: voucherCode,
        IsActive: true,
        ExpiryDate: { [Op.gt]: sequelize.fn("getdate") },
      },
    });

    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: "Voucher không tồn tại hoặc đã hết hạn",
      });
    }

    // Kiểm tra user đã nhận voucher
    const userVoucher = await UserVouchers.findOne({
      where: { UserId: userId, VoucherId: voucher.VoucherId },
    });

    if (!userVoucher) {
      return res
        .status(403)
        .json({ success: false, message: "Bạn chưa nhận voucher này" });
    }

    if (userVoucher.IsUsed) {
      return res
        .status(400)
        .json({ success: false, message: "Voucher đã được sử dụng" });
    }

    // Kiểm tra subtotal
    if (voucher.MinOrderAmount && subtotal < voucher.MinOrderAmount) {
      return res.status(400).json({
        success: false,
        message: `Đơn hàng phải >= ${voucher.MinOrderAmount} ₫ để áp dụng voucher`,
      });
    }

    // Tính giảm giá
    let discount = 0;
    if (voucher.DiscountAmount) discount += parseFloat(voucher.DiscountAmount);
    if (voucher.DiscountPercentage)
      discount +=
        (parseFloat(voucher.DiscountPercentage) / 100) * (subtotal || 0);

    res.json({
      success: true,
      discountAmount: discount, // luôn có giá trị
      message: "Voucher áp dụng thành công!",
    });
  } catch (err) {
    console.error("APPLY VOUCHER ERROR:", err);
    res
      .status(500)
      .json({ success: false, message: "Lỗi khi áp dụng voucher" });
  }
};

// =========================
// 📌 LẤY DANH SÁCH THÔNG BÁO
// =========================
const getNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 4;
    const offset = (page - 1) * pageSize;

    const notifications = await Notifications.findAll({
      where: { UserId: req.user.id },
      attributes: ["NotificationId", "Title", "Message", "IsRead", "CreatedAt"],
      order: [["CreatedAt", "DESC"]],
      offset,
      limit: pageSize,
    });

    const total = await Notifications.count({
      where: { UserId: req.user.id },
    });

    res.json({
      success: true,
      data: {
        notifications,
        total,
        currentPage: page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (err) {
    console.error("GET NOTIFICATIONS ERROR:", err);
    res
      .status(500)
      .json({ success: false, message: "Lỗi khi lấy danh sách thông báo." });
  }
};

// =========================
// 📌 ĐÁNH DẤU THÔNG BÁO LÀ ĐÃ ĐỌC
// =========================
const readNotification = async (req, res) => {
  try {
    const { notificationId } = req.body;
    if (!notificationId) {
      return res.json({ success: false, message: "Thiếu notificationId!" });
    }

    const notification = await Notifications.findOne({
      where: { NotificationId: notificationId, UserId: req.user.id },
    });

    if (!notification) {
      return res.json({ success: false, message: "Không tìm thấy thông báo!" });
    }

    await notification.update({ IsRead: true });

    res.json({ success: true, message: "Đã đánh dấu là đã đọc!" });
  } catch (err) {
    console.error("READ NOTIFICATION ERROR:", err);
    res
      .status(500)
      .json({ success: false, message: "Lỗi khi cập nhật thông báo." });
  }
};

// =========================
// 📌 ĐÁNH DẤU TẤT CẢ THÔNG BÁO LÀ ĐÃ ĐỌC
// =========================
const readAllNotifications = async (req, res) => {
  try {
    await Notifications.update(
      { IsRead: true },
      { where: { UserId: req.user.id } }
    );

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
};

// =========================
// 📌 XÓA MỘT THÔNG BÁO
// =========================
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Notifications.destroy({
      where: { NotificationId: id, UserId: req.user.id },
    });

    if (result === 0) {
      return res.json({ success: false, message: "Không tìm thấy thông báo." });
    }

    res.json({ success: true, message: "Đã xóa thông báo thành công!" });
  } catch (err) {
    console.error("DELETE NOTIFICATION ERROR:", err);
    res.status(500).json({ success: false, message: "Lỗi khi xóa thông báo." });
  }
};

// Export tất cả middleware và controller
module.exports = {
  authenticate,
  upload,
  getProfile,
  updateProfile,
  getOrders,
  cancelOrder,
  getAvatar,
  getVouchers,
  receiveVoucher,
  getUserVouchers,
  applyVoucher,
  getNotifications,
  readNotification,
  readAllNotifications,
  deleteNotification,
};
