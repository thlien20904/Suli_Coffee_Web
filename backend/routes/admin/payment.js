const express = require("express");
const { poolPromise } = require("../../db");
const sql = require("mssql");

const router = express.Router();

// ================== LẤY DANH SÁCH PAYMENT METHODS ==================
router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .query("SELECT * FROM PhuongThucThanhToan ORDER BY Id DESC");
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error("❌ Lỗi lấy phương thức thanh toán:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

// ================== THÊM PAYMENT METHOD ==================
router.post("/add", async (req, res) => {
  try {
    const { TenPhuongThuc } = req.body;
    if (!TenPhuongThuc || TenPhuongThuc.trim() === "") {
      return res
        .status(400)
        .json({ success: false, message: "Tên phương thức không được rỗng" });
    }

    const pool = await poolPromise;

    // Kiểm tra trùng tên
    const check = await pool
      .request()
      .input("TenPhuongThuc", sql.NVarChar, TenPhuongThuc.trim())
      .query(
        "SELECT COUNT(*) AS count FROM PhuongThucThanhToan WHERE LOWER(TenPhuongThuc) = LOWER(@TenPhuongThuc)"
      );

    if (check.recordset[0].count > 0) {
      return res.json({
        success: false,
        message: "Tên phương thức đã tồn tại",
      });
    }

    await pool
      .request()
      .input("TenPhuongThuc", sql.NVarChar, TenPhuongThuc.trim())
      .query(
        "INSERT INTO PhuongThucThanhToan (TenPhuongThuc) VALUES (@TenPhuongThuc)"
      );

    return res.json({ success: true, message: "Thêm phương thức thành công!" });
  } catch (err) {
    console.error("❌ Lỗi thêm phương thức:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

// ================== LẤY 1 PAYMENT METHOD THEO ID ==================
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
      .input("Id", sql.Int, id)
      .query("SELECT * FROM PhuongThucThanhToan WHERE Id = @Id");

    if (!result.recordset.length) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy phương thức" });
    }

    return res.json({ success: true, data: result.recordset[0] });
  } catch (err) {
    console.error("❌ Lỗi lấy phương thức theo ID:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

// ================== SỬA PAYMENT METHOD ==================
router.post("/edit/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { TenPhuongThuc } = req.body;

    if (!id || !TenPhuongThuc) {
      return res
        .status(400)
        .json({ success: false, message: "Dữ liệu không hợp lệ" });
    }

    const pool = await poolPromise;

    // Kiểm tra trùng tên (trừ chính nó)
    const check = await pool
      .request()
      .input("TenPhuongThuc", sql.NVarChar, TenPhuongThuc.trim())
      .input("Id", sql.Int, id)
      .query(
        "SELECT COUNT(*) AS count FROM PhuongThucThanhToan WHERE LOWER(TenPhuongThuc) = LOWER(@TenPhuongThuc) AND Id != @Id"
      );

    if (check.recordset[0].count > 0) {
      return res.json({
        success: false,
        message: "Tên phương thức đã tồn tại",
      });
    }

    await pool
      .request()
      .input("Id", sql.Int, id)
      .input("TenPhuongThuc", sql.NVarChar, TenPhuongThuc.trim())
      .query(
        "UPDATE PhuongThucThanhToan SET TenPhuongThuc = @TenPhuongThuc WHERE Id = @Id"
      );

    return res.json({
      success: true,
      message: "Cập nhật phương thức thành công!",
    });
  } catch (err) {
    console.error("❌ Lỗi sửa phương thức:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

// ================== XÓA PAYMENT METHOD ==================
router.post("/delete", async (req, res) => {
  try {
    const { id } = req.body;
    if (!id || isNaN(parseInt(id))) {
      return res
        .status(400)
        .json({ success: false, message: "ID không hợp lệ" });
    }

    const pool = await poolPromise;

    // Kiểm tra tồn tại
    const check = await pool
      .request()
      .input("Id", sql.Int, id)
      .query("SELECT * FROM PhuongThucThanhToan WHERE Id = @Id");

    if (!check.recordset.length) {
      return res
        .status(404)
        .json({ success: false, message: "Phương thức không tồn tại" });
    }

    // Xóa
    await pool
      .request()
      .input("Id", sql.Int, id)
      .query("DELETE FROM PhuongThucThanhToan WHERE Id = @Id");

    return res.json({ success: true, message: "Xóa phương thức thành công!" });
  } catch (err) {
    console.error("❌ Lỗi xóa phương thức:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

// ================== CHECK TÊN TRÙNG (AJAX) ==================
router.get("/check-name", async (req, res) => {
  try {
    const { tenPhuongThuc } = req.query;
    if (!tenPhuongThuc)
      return res.json({ success: false, message: "Thiếu tenPhuongThuc" });

    const pool = await poolPromise;
    const check = await pool
      .request()
      .input("TenPhuongThuc", sql.NVarChar, tenPhuongThuc.trim())
      .query(
        "SELECT COUNT(*) AS count FROM PhuongThucThanhToan WHERE LOWER(TenPhuongThuc) = LOWER(@TenPhuongThuc)"
      );

    return res.json({
      success: true,
      available: check.recordset[0].count === 0,
    });
  } catch (err) {
    console.error("❌ Lỗi check tên phương thức:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

module.exports = router;
