const express = require("express");
const router = express.Router();
const ordersUserController = require("../../controllers/user/ordersUserController");

// ✅ IMPORT HÀM MỚI
const {
  autoCancelPendingOrders,
} = require("../../controllers/user/ordersUserController");

// ✅ import middleware xác thực
const {
  authenticateToken,
} = require("../../controllers/user/ordersUserController");

// ✅ CHẠY HÀM TỰ ĐỘNG HỦY MỖI PHÚT
setInterval(autoCancelPendingOrders, 60 * 1000); // 60 * 1000ms = 1 phút

// ✅ Gắn middleware vào các route cần đăng nhập
router.post("/prepare", authenticateToken, ordersUserController.prepareOrder);
router.post("/place-order", authenticateToken, ordersUserController.placeOrder);
router.post(
  "/save-pending",
  authenticateToken,
  ordersUserController.savePending
);

router.get(
  "/pending",
  authenticateToken,
  ordersUserController.getPendingOrders
);

// VNPay callback không cần token - đặt trước route ":orderId" để tránh bị coi là param
router.get("/vnpay-return", ordersUserController.vnpayReturn);

router.get("/:orderId", authenticateToken, ordersUserController.getOrderById);

module.exports = router;
