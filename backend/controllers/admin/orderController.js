const sequelize = require("../../config/sequelize");
const initModels = require("../../models/init-models");
const models = initModels(sequelize);
const { Sequelize, Op } = require("sequelize");

const { Orders, Users, OrderStatus, PaymentStatus } = models;

/* =====================================================
   1️⃣ LẤY DANH SÁCH ĐƠN HÀNG (Admin)
   GET /api/admin/orders
===================================================== */
exports.getOrders = async (req, res) => {
  try {
    const orders = await Orders.findAll({
      include: [
        {
          model: Users,
          as: "User",
          attributes: ["Id", "FullName"],
          required: true,
        },
        {
          model: OrderStatus,
          as: "Status",
          attributes: ["StatusId", "StatusName"],
          required: true,
        },
        {
          model: PaymentStatus,
          as: "PaymentStatus", // ✅ thêm trạng thái thanh toán
          attributes: ["PaymentStatusId", "PaymentStatusName"],
          required: false,
        },
      ],
      order: [["OrderDate", "DESC"]],
    });

    res.json({ success: true, data: orders });
  } catch (err) {
    console.error("❌ Lỗi lấy danh sách đơn hàng:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

/* =====================================================
   2️⃣ CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG
   POST /api/admin/orders/:id/status
===================================================== */
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { statusId } = req.body;

    if (!id || !statusId) {
      return res.status(400).json({
        success: false,
        message: "Thiếu dữ liệu!",
      });
    }

    const orderId = parseInt(id);
    const newStatusId = parseInt(statusId);

    // Tìm đơn hàng kèm PaymentStatus
    const order = await Orders.findByPk(orderId, {
      include: [{ model: PaymentStatus, as: "PaymentStatus" }],
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng!",
      });
    }

    // Nếu đơn hàng đã hủy hoặc thanh toán thất bại → không cho update
    if (order.StatusId === 2) {
      return res.status(400).json({
        success: false,
        message: "Đơn hàng đã hủy, không thể cập nhật trạng thái!",
      });
    }

    if (order.PaymentStatusId === 3) {
      return res.status(400).json({
        success: false,
        message: "Đơn hàng thanh toán thất bại, không thể cập nhật trạng thái!",
      });
    }

    // Kiểm tra trạng thái mới hợp lệ
    const status = await OrderStatus.findByPk(newStatusId);
    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Trạng thái không hợp lệ!",
      });
    }

    // Cập nhật trạng thái
    await order.update({ StatusId: newStatusId });

    res.json({
      success: true,
      message: "Cập nhật trạng thái thành công!",
      newStatus: {
        StatusId: status.StatusId,
        StatusName: status.StatusName,
      },
    });
  } catch (err) {
    console.error("❌ Lỗi cập nhật trạng thái:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};
