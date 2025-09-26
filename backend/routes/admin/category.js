const express = require("express");
const { poolPromise } = require("../../db");
const sql = require("mssql");

const router = express.Router();

// ================== LẤY DANH SÁCH CATEGORY ==================
router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .query("SELECT * FROM Category ORDER BY CategoryId DESC");
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error("❌ Lỗi lấy categories:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

// ================== THÊM CATEGORY ==================
router.post("/add", async (req, res) => {
  try {
    const { CategoryName } = req.body;
    if (!CategoryName || CategoryName.trim() === "") {
      return res
        .status(400)
        .json({ success: false, message: "Tên danh mục không được rỗng" });
    }

    const pool = await poolPromise;

    // Kiểm tra trùng tên
    const check = await pool
      .request()
      .input("CategoryName", sql.NVarChar, CategoryName.trim())
      .query(
        "SELECT COUNT(*) AS count FROM Category WHERE LOWER(CategoryName) = LOWER(@CategoryName)"
      );

    if (check.recordset[0].count > 0) {
      return res.json({ success: false, message: "Tên danh mục đã tồn tại" });
    }

    await pool
      .request()
      .input("CategoryName", sql.NVarChar, CategoryName.trim())
      .query("INSERT INTO Category (CategoryName) VALUES (@CategoryName)");

    return res.json({ success: true, message: "Thêm danh mục thành công!" });
  } catch (err) {
    console.error("❌ Lỗi thêm category:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});
// ================== LẤY 1 CATEGORY THEO ID ==================
router.get("/edit/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "ID không hợp lệ" });
    }

    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("CategoryId", sql.Int, id)
      .query("SELECT * FROM Category WHERE CategoryId = @CategoryId");

    if (!result.recordset.length) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy danh mục" });
    }

    return res.json({ success: true, data: result.recordset[0] });
  } catch (err) {
    console.error("❌ Lỗi lấy category theo ID:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

// ================== SỬA CATEGORY ==================
router.post("/edit/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { CategoryName } = req.body;

    if (!id || !CategoryName) {
      return res
        .status(400)
        .json({ success: false, message: "Dữ liệu không hợp lệ" });
    }

    const pool = await poolPromise;

    // Kiểm tra trùng tên (trừ chính nó)
    const check = await pool
      .request()
      .input("CategoryName", sql.NVarChar, CategoryName.trim())
      .input("CategoryId", sql.Int, id)
      .query(
        "SELECT COUNT(*) AS count FROM Category WHERE LOWER(CategoryName) = LOWER(@CategoryName) AND CategoryId != @CategoryId"
      );

    if (check.recordset[0].count > 0) {
      return res.json({ success: false, message: "Tên danh mục đã tồn tại" });
    }

    await pool
      .request()
      .input("CategoryId", sql.Int, id)
      .input("CategoryName", sql.NVarChar, CategoryName.trim())
      .query(
        "UPDATE Category SET CategoryName = @CategoryName WHERE CategoryId = @CategoryId"
      );

    return res.json({
      success: true,
      message: "Cập nhật danh mục thành công!",
    });
  } catch (err) {
    console.error("❌ Lỗi sửa category:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

// ================== XÓA CATEGORY ==================
router.post("/delete", async (req, res) => {
  try {
    const { id } = req.body;
    if (!id || isNaN(parseInt(id))) {
      return res
        .status(400)
        .json({ success: false, message: "ID không hợp lệ" });
    }

    const pool = await poolPromise;

    // Kiểm tra danh mục có tồn tại
    const category = await pool
      .request()
      .input("CategoryId", sql.Int, id)
      .query("SELECT * FROM Category WHERE CategoryId = @CategoryId");
    if (!category.recordset.length) {
      return res
        .status(404)
        .json({ success: false, message: "Danh mục không tồn tại" });
    }

    // Xóa
    await pool
      .request()
      .input("CategoryId", sql.Int, id)
      .query("DELETE FROM Category WHERE CategoryId = @CategoryId");

    return res.json({ success: true, message: "Xóa danh mục thành công!" });
  } catch (err) {
    console.error("❌ Lỗi xóa category:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

// ================== CHECK TÊN TRÙNG (AJAX) ==================
router.get("/check-name", async (req, res) => {
  try {
    const { categoryName } = req.query;
    if (!categoryName)
      return res.json({ success: false, message: "Thiếu categoryName" });

    const pool = await poolPromise;
    const check = await pool
      .request()
      .input("CategoryName", sql.NVarChar, categoryName.trim())
      .query(
        "SELECT COUNT(*) AS count FROM Category WHERE LOWER(CategoryName) = LOWER(@CategoryName)"
      );

    return res.json({
      success: true,
      available: check.recordset[0].count === 0,
    });
  } catch (err) {
    console.error("❌ Lỗi check category name:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

module.exports = router;
