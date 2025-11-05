const express = require("express");
const router = express.Router();
const ordersUserController = require("../../controllers/user/ordersUserController");

// ✅ import middleware xác thực
const {
  authenticateToken,
} = require("../../controllers/user/ordersUserController");

// ✅ Gắn middleware vào các route cần đăng nhập
router.post("/prepare", authenticateToken, ordersUserController.prepareOrder);
router.post("/place-order", authenticateToken, ordersUserController.placeOrder);

// VNPay callback không cần token
router.get("/vnpay-return", ordersUserController.vnpayReturn);

module.exports = router;
