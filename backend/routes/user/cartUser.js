const express = require("express");
const router = express.Router();
const cartController = require("../../controllers/user/cartUserController");

// Import middleware từ controller
const { authenticateToken } = cartController;

// Thêm vào giỏ
router.post("/add", authenticateToken, cartController.addToCart);

// Lấy giỏ
router.get("/", authenticateToken, cartController.getCart);

// Cập nhật số lượng
router.post("/update", authenticateToken, cartController.updateCart);

// Xóa item
router.post("/delete", authenticateToken, cartController.deleteCart);

module.exports = router;
