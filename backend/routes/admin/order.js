const express = require("express");
const router = express.Router();
const orderController = require("../../controllers/admin/orderController");

/* =====================================================
   1️⃣ LẤY DANH SÁCH ĐƠN HÀNG
===================================================== */
router.get("/", orderController.getOrders);

/* =====================================================
   2️⃣ CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG
===================================================== */
router.post("/:id/status", orderController.updateOrderStatus);

module.exports = router;
