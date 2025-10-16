// routes/user/StoresUser.js
const express = require("express");
const router = express.Router();
const { poolPromise, sql } = require("../../db");

// 📌 Lấy danh sách tất cả cửa hàng
router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT CuaHangId, CuaHangName, address, opening_hours, image_url, phone, latitude, longitude
      FROM CuaHang
      ORDER BY CuaHangId DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error("Error fetching stores:", err);
    res.status(500).json({ message: "Lỗi server khi lấy danh sách cửa hàng!" });
  }
});

// 📌 Lấy thông tin chi tiết 1 cửa hàng
router.get("/:id", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("CuaHangId", sql.Int, req.params.id).query(`
        SELECT CuaHangId, CuaHangName, address, opening_hours, image_url, phone, latitude, longitude
        FROM CuaHang WHERE CuaHangId = @CuaHangId
      `);
    if (result.recordset.length === 0)
      return res.status(404).json({ message: "Không tìm thấy cửa hàng!" });
    res.json(result.recordset[0]);
  } catch (err) {
    console.error("Error fetching store:", err);
    res.status(500).json({ message: "Lỗi server khi lấy chi tiết cửa hàng!" });
  }
});

module.exports = router;
