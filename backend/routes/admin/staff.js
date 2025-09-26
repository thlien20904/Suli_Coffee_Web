const express = require("express");
const { poolPromise } = require("../../db");
const sql = require("mssql");

const router = express.Router();

// ================== LẤY DANH SÁCH STAFF ==================
router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT 
        s.StaffId, 
        s.FullName, 
        s.Phone, 
        s.DateOfBirth, 
        s.Email, 
        s.Gender,
        r.RoleId,
        r.RoleName
      FROM Staff s
      LEFT JOIN AccRole r ON s.RoleId = r.RoleId
      ORDER BY s.StaffId DESC
    `);
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error("❌ Lỗi lấy staff:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

// ================== API HỖ TRỢ FORM (CHỈ LẤY ROLE) ==================
router.get("/form-data", async (req, res) => {
  try {
    const pool = await poolPromise;
    const roles = await pool.request().query(`
      SELECT RoleId, RoleName 
      FROM AccRole 
      ORDER BY RoleId ASC
    `);

    res.json({
      success: true,
      roles: roles.recordset,
    });
  } catch (err) {
    console.error("❌ Lỗi lấy form-data staff:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

// ================== THÊM STAFF ==================
router.post("/add", async (req, res) => {
  try {
    const { FullName, Phone, DateOfBirth, Email, Gender, RoleId } = req.body;

    if (!FullName || !RoleId) {
      return res
        .status(400)
        .json({ success: false, message: "Thiếu dữ liệu bắt buộc" });
    }

    const pool = await poolPromise;

    // Check email trùng
    if (Email) {
      const check = await pool
        .request()
        .input("Email", sql.NVarChar, Email.trim())
        .query(
          "SELECT COUNT(*) AS count FROM Staff WHERE LOWER(Email)=LOWER(@Email)"
        );
      if (check.recordset[0].count > 0) {
        return res.json({ success: false, message: "Email đã tồn tại" });
      }
    }

    await pool
      .request()
      .input("FullName", sql.NVarChar, FullName.trim())
      .input("Phone", sql.NVarChar, Phone || null)
      .input("DateOfBirth", sql.Date, DateOfBirth || null)
      .input("Email", sql.NVarChar, Email || null)
      .input("Gender", sql.NVarChar, Gender || null)
      .input("RoleId", sql.Int, RoleId)
      .query(
        `INSERT INTO Staff (FullName, Phone, DateOfBirth, Email, Gender, RoleId)
         VALUES (@FullName,@Phone,@DateOfBirth,@Email,@Gender,@RoleId)`
      );

    return res.json({ success: true, message: "Thêm nhân viên thành công!" });
  } catch (err) {
    console.error("❌ Lỗi thêm staff:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

// ================== LẤY 1 STAFF ==================
router.get("/edit/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const pool = await poolPromise;
    const rs = await pool
      .request()
      .input("StaffId", sql.Int, id)
      .query(
        `SELECT s.*, r.RoleName
         FROM Staff s
         LEFT JOIN AccRole r ON s.RoleId=r.RoleId
         WHERE s.StaffId=@StaffId`
      );

    if (!rs.recordset.length)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy nhân viên" });

    res.json({ success: true, data: rs.recordset[0] });
  } catch (err) {
    console.error("❌ Lỗi lấy staff ID:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

// ================== SỬA STAFF ==================
router.post("/edit/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { FullName, Phone, DateOfBirth, Email, Gender, RoleId } = req.body;

    if (!FullName || !RoleId) {
      return res
        .status(400)
        .json({ success: false, message: "Thiếu dữ liệu bắt buộc" });
    }

    const pool = await poolPromise;

    if (Email) {
      const check = await pool
        .request()
        .input("Email", sql.NVarChar, Email.trim())
        .input("StaffId", sql.Int, id)
        .query(
          "SELECT COUNT(*) AS count FROM Staff WHERE LOWER(Email)=LOWER(@Email) AND StaffId!=@StaffId"
        );
      if (check.recordset[0].count > 0) {
        return res.json({ success: false, message: "Email đã tồn tại" });
      }
    }

    await pool
      .request()
      .input("StaffId", sql.Int, id)
      .input("FullName", sql.NVarChar, FullName.trim())
      .input("Phone", sql.NVarChar, Phone || null)
      .input("DateOfBirth", sql.Date, DateOfBirth || null)
      .input("Email", sql.NVarChar, Email || null)
      .input("Gender", sql.NVarChar, Gender || null)
      .input("RoleId", sql.Int, RoleId)
      .query(
        `UPDATE Staff SET 
          FullName=@FullName, Phone=@Phone, DateOfBirth=@DateOfBirth, 
          Email=@Email, Gender=@Gender, RoleId=@RoleId
         WHERE StaffId=@StaffId`
      );

    res.json({ success: true, message: "Cập nhật nhân viên thành công!" });
  } catch (err) {
    console.error("❌ Lỗi sửa staff:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

// ================== XÓA STAFF ==================
router.post("/delete", async (req, res) => {
  try {
    const { id } = req.body;
    const pool = await poolPromise;
    const rs = await pool
      .request()
      .input("StaffId", sql.Int, id)
      .query("SELECT * FROM Staff WHERE StaffId=@StaffId");
    if (!rs.recordset.length)
      return res.json({ success: false, message: "Nhân viên không tồn tại" });

    await pool
      .request()
      .input("StaffId", sql.Int, id)
      .query("DELETE FROM Staff WHERE StaffId=@StaffId");

    res.json({ success: true, message: "Xóa nhân viên thành công!" });
  } catch (err) {
    console.error("❌ Lỗi xóa staff:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

module.exports = router;
