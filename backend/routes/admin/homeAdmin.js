// routes/admin/homeAdmin.js
const express = require("express");
const router = express.Router();
const { poolPromise, sql } = require("../../db");

// Middleware kiểm tra quyền Admin (sử dụng req.auth từ JWT v8)
const isAdmin = (req, res, next) => {
  console.log("isAdmin middleware, req.auth:", req.auth);
  if (!req.auth || req.auth.role !== "admin") {
    return res
      .status(403)
      .json({ errors: [{ msg: "Quyền truy cập bị từ chối." }] });
  }
  next();
};
/**
 * GET /api/admin/home
 * Lấy dữ liệu tổng quan cho trang chủ Admin
 * - Số lượng người dùng
 * - Số lượng đơn hàng
 * - Tổng doanh thu
 * - Số sản phẩm
 */
router.get("/home", isAdmin, async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT 
        (SELECT COUNT(*) FROM Users) AS totalUsers,
        (SELECT COUNT(*) FROM Orders WHERE Status IN ('Confirmed', 'Shipped', 'Delivered')) AS totalOrders,
        (SELECT ISNULL(SUM(TotalAmount), 0) FROM Orders WHERE Status IN ('Confirmed', 'Shipped', 'Delivered')) AS totalRevenue,
        (SELECT COUNT(*) FROM Products) AS totalProducts
    `);

    const data = result.recordset[0] || {
      totalUsers: 0,
      totalOrders: 0,
      totalRevenue: 0,
      totalProducts: 0,
    }; // Fallback nếu rỗng
    res.json({
      status: "success",
      data: {
        totalUsers: parseInt(data.totalUsers),
        totalOrders: parseInt(data.totalOrders),
        totalRevenue: parseFloat(data.totalRevenue),
        totalProducts: parseInt(data.totalProducts),
      },
    });
  } catch (err) {
    console.error("ADMIN HOME ERROR:", err);
    res.status(500).json({ errors: [{ msg: "Lỗi máy chủ" }] });
  }
});

module.exports = router;
