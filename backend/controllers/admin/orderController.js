const sequelize = require("../../config/sequelize");
const initModels = require("../../models/init-models");
const models = initModels(sequelize);
const { Sequelize, Op } = require("sequelize");
const {
  emitOrderStatusChange,
  emitUserNotification,
  emitAdminNotification,
} = require("../../utils/realtimeHelper");

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
          as: "PaymentStatus",
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

    // Nếu đơn hàng đã hủy (OrderStatusId = 5) → không cho update
    if (order.StatusId === 5) {
      return res.status(400).json({
        success: false,
        message: "Đơn hàng đã hủy, không thể cập nhật trạng thái!",
      });
    }

    // Nếu thanh toán thất bại (PaymentStatusId = 3) → không cho update
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

    // ✅ Emit real-time event
    const statusChangeData = {
      orderId: order.OrderId,
      status: status.StatusName,
      statusId: status.StatusId,
      message: `Đơn hàng đã được cập nhật sang trạng thái: ${status.StatusName}`,
    };

    emitOrderStatusChange(req, order.UserId, statusChangeData);
    emitUserNotification(req, order.UserId, {
      type: "order-status",
      title: "Cập nhật đơn hàng",
      message: `Đơn hàng #${order.OrderId} - ${status.StatusName}`,
    });
    emitAdminNotification(req, {
      type: "order-status",
      title: "Đã cập nhật trạng thái",
      message: `Đơn hàng #${order.OrderId} → ${status.StatusName}`,
      data: statusChangeData,
    });

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
