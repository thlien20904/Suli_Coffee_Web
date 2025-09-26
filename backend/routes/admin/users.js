const express = require("express");
const router = express.Router();
const sql = require("mssql");
const { poolPromise } = require("../../db"); // import poolPromise từ db.js

// 👉 Lấy danh sách user (loại bỏ admin)
router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT 
        Id, 
        Username, 
        FullName, 
        Email, 
        Phone, 
        Address, 
        Role, 
        AvatarUrl, 
        CreatedDate
      FROM Users
      WHERE Role != 'Admin'   -- ❌ loại bỏ admin
      ORDER BY CreatedDate DESC
    `);

    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error("❌ SQL Error:", err);
    res
      .status(500)
      .json({ success: false, message: "Lỗi server", error: err.message });
  }
});

// ✅ Cấm User
router.patch("/:id/ban", async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("Id", sql.Int, id)
      .query(
        "UPDATE Users SET Role = 'Banned' WHERE Id = @Id AND Role != 'Admin'"
      );

    if (result.rowsAffected[0] > 0) {
      res.json({ success: true, message: "Đã cấm user thành công" });
    } else {
      res
        .status(404)
        .json({
          success: false,
          message: "Không tìm thấy user hoặc không thể cấm admin",
        });
    }
  } catch (err) {
    console.error("❌ Lỗi khi cấm user:", err);
    res
      .status(500)
      .json({ success: false, message: "Lỗi server", error: err.message });
  }
});

// ✅ Bỏ cấm User
router.patch("/:id/unban", async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("Id", sql.Int, id)
      .query(
        "UPDATE Users SET Role = 'User' WHERE Id = @Id AND Role != 'Admin'"
      );

    if (result.rowsAffected[0] > 0) {
      res.json({ success: true, message: "Đã bỏ cấm user thành công" });
    } else {
      res
        .status(404)
        .json({
          success: false,
          message: "Không tìm thấy user hoặc không thể bỏ cấm admin",
        });
    }
  } catch (err) {
    console.error("❌ Lỗi khi bỏ cấm user:", err);
    res
      .status(500)
      .json({ success: false, message: "Lỗi server", error: err.message });
  }
});

module.exports = router;
