const express = require("express");
const router = express.Router();
const { poolPromise } = require("../../db");

/* =========================
   📌 GET /api/stores
   → Lấy danh sách toàn bộ cửa hàng
========================= */
router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT 
        CuaHangId,
        CuaHangName,
        address,
        opening_hours,
        image_url,
        phone,
        created_at
      FROM CuaHang
      ORDER BY CuaHangName
    `);

    res.status(200).json({
      success: true,
      total: result.recordset.length,
      data: result.recordset,
    });
  } catch (err) {
    console.error("GET /api/stores ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Lỗi máy chủ khi lấy danh sách cửa hàng.",
    });
  }
});

/* =========================
   📌 GET /api/stores/:id
   → Lấy chi tiết 1 cửa hàng
========================= */
router.get("/:id", async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool
      .request()
      .input("CuaHangId", req.params.id)
      .query(`
        SELECT 
          CuaHangId,
          CuaHangName,
          address,
          opening_hours,
          image_url,
          phone,
          created_at
        FROM CuaHang
        WHERE CuaHangId = @CuaHangId
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy cửa hàng với ID này.",
      });
    }

    res.status(200).json({
      success: true,
      data: result.recordset[0],
    });
  } catch (err) {
    console.error("GET /api/stores/:id ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Lỗi máy chủ khi lấy chi tiết cửa hàng.",
    });
  }
});

/* =========================
   📌 GET /api/stores/search?keyword=
   → Tìm kiếm cửa hàng theo tên hoặc địa chỉ
========================= */
router.get("/search", async (req, res) => {
  try {
    const keyword = req.query.keyword ? req.query.keyword.trim() : "";

    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: "Thiếu từ khóa tìm kiếm.",
      });
    }

    const pool = await poolPromise;

    const result = await pool
      .request()
      .input("Keyword", `%${keyword}%`)
      .query(`
        SELECT 
          CuaHangId,
          CuaHangName,
          address,
          opening_hours,
          image_url,
          phone,
          created_at
        FROM CuaHang
        WHERE CuaHangName LIKE @Keyword OR address LIKE @Keyword
        ORDER BY CuaHangName
      `);

    res.status(200).json({
      success: true,
      total: result.recordset.length,
      data: result.recordset,
    });
  } catch (err) {
    console.error("GET /api/stores/search ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Lỗi máy chủ khi tìm kiếm cửa hàng.",
    });
  }
});

module.exports = router;
