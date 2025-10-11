const express = require("express");
const { poolPromise } = require("../../db");
const sql = require("mssql");

const router = express.Router();

/* ============================================================
   🎟️ QUẢN LÝ VOUCHER (ADMIN + USER)
   - Admin: thêm / sửa / xóa / xem danh sách voucher
   - Cấp voucher cho user, xem ai đã nhận
============================================================ */

// ================== LẤY DANH SÁCH VOUCHER ==================
router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .query("SELECT * FROM Vouchers ORDER BY VoucherId DESC");
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error("❌ Lỗi lấy danh sách voucher:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

// ================== XEM TẤT CẢ VOUCHER ĐÃ CẤP ==================
router.get("/assigned", async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT 
        uv.UserVoucherId AS AssignedId,
        u.FullName,
        u.Id AS UserId,
        v.VoucherId,
        v.Code AS VoucherCode,
        v.Description,
        v.ExpiryDate AS ExpiredDate,
        uv.ReceivedDate AS AssignedDate,
        uv.IsUsed
      FROM UserVouchers uv
      JOIN Users u ON uv.UserId = u.Id
      JOIN Vouchers v ON uv.VoucherId = v.VoucherId
      ORDER BY uv.ReceivedDate DESC
    `);

    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error("❌ Lỗi lấy danh sách voucher đã cấp:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

// ================== CẤP VOUCHER CHO USER ==================
router.post("/assign", async (req, res) => {
  try {
    const { UserId, VoucherId } = req.body;

    if (!UserId || !VoucherId)
      return res
        .status(400)
        .json({ success: false, message: "Thiếu UserId hoặc VoucherId" });

    const pool = await poolPromise;

    // Kiểm tra trùng
    const check = await pool
      .request()
      .input("UserId", sql.Int, UserId)
      .input("VoucherId", sql.Int, VoucherId)
      .query(
        "SELECT COUNT(*) AS count FROM UserVouchers WHERE UserId=@UserId AND VoucherId=@VoucherId"
      );

    if (check.recordset[0].count > 0)
      return res.json({
        success: false,
        message: "Người dùng đã nhận voucher này",
      });

    await pool
      .request()
      .input("UserId", sql.Int, UserId)
      .input("VoucherId", sql.Int, VoucherId)
      .query(
        "INSERT INTO UserVouchers (UserId, VoucherId) VALUES (@UserId, @VoucherId)"
      );

    // Gửi thông báo
    await pool
      .request()
      .input("UserId", sql.Int, UserId)
      .input("Title", sql.NVarChar, "🎁 Nhận Voucher mới")
      .input("Message", sql.NVarChar, "Bạn vừa nhận được một voucher mới!")
      .query(
        "INSERT INTO Notifications (UserId, Title, Message) VALUES (@UserId, @Title, @Message)"
      );

    res.json({ success: true, message: "Cấp voucher cho user thành công!" });
  } catch (err) {
    console.error("❌ Lỗi cấp voucher:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});
// ================== 🎁 CẤP VOUCHER CHO TẤT CẢ USER ==================
router.post("/assign/all", async (req, res) => {
  try {
    const { VoucherId } = req.body;

    if (!VoucherId)
      return res
        .status(400)
        .json({ success: false, message: "Thiếu VoucherId" });

    const pool = await poolPromise;

    // Lấy toàn bộ danh sách user (trừ admin nếu muốn)
    const users = await pool
      .request()
      .query("SELECT Id FROM Users WHERE Role != 'admin'");

    if (!users.recordset.length)
      return res.json({ success: false, message: "Không có user nào để cấp" });

    let count = 0;

    for (const user of users.recordset) {
      const check = await pool
        .request()
        .input("UserId", sql.Int, user.Id)
        .input("VoucherId", sql.Int, VoucherId)
        .query(
          "SELECT COUNT(*) AS count FROM UserVouchers WHERE UserId=@UserId AND VoucherId=@VoucherId"
        );

      // Nếu chưa có thì thêm mới
      if (check.recordset[0].count === 0) {
        await pool
          .request()
          .input("UserId", sql.Int, user.Id)
          .input("VoucherId", sql.Int, VoucherId)
          .query(
            "INSERT INTO UserVouchers (UserId, VoucherId) VALUES (@UserId, @VoucherId)"
          );

        // Gửi thông báo
        await pool
          .request()
          .input("UserId", sql.Int, user.Id)
          .input("Title", sql.NVarChar, "🎁 Voucher mới dành cho bạn!")
          .input(
            "Message",
            sql.NVarChar,
            "Admin vừa cấp cho bạn một voucher mới."
          )
          .query(
            "INSERT INTO Notifications (UserId, Title, Message) VALUES (@UserId, @Title, @Message)"
          );

        count++;
      }
    }

    res.json({
      success: true,
      message: `Đã cấp voucher cho ${count} người dùng!`,
    });
  } catch (err) {
    console.error("❌ Lỗi cấp voucher cho tất cả user:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

// ================== XEM VOUCHER CỦA USER ==================
router.get("/user/:id", async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const pool = await poolPromise;

    const result = await pool.request().input("UserId", sql.Int, userId).query(`
        SELECT uv.*, v.Code, v.Description, v.DiscountAmount, v.DiscountPercentage, v.ExpiryDate
        FROM UserVouchers uv
        JOIN Vouchers v ON uv.VoucherId = v.VoucherId
        WHERE uv.UserId = @UserId
      `);

    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error("❌ Lỗi lấy voucher user:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

// ================== THÊM VOUCHER ==================
router.post("/add", async (req, res) => {
  try {
    const {
      Code,
      DiscountAmount,
      DiscountPercentage,
      MinOrderAmount,
      ExpiryDate,
      MaxUsage,
      Description,
    } = req.body;

    if (!Code || !ExpiryDate)
      return res
        .status(400)
        .json({ success: false, message: "Thiếu Code hoặc ExpiryDate" });

    const pool = await poolPromise;

    // Kiểm tra trùng mã
    const check = await pool
      .request()
      .input("Code", sql.NVarChar, Code.trim())
      .query(
        "SELECT COUNT(*) AS count FROM Vouchers WHERE LOWER(Code) = LOWER(@Code)"
      );

    if (check.recordset[0].count > 0)
      return res.json({ success: false, message: "Mã voucher đã tồn tại" });

    await pool
      .request()
      .input("Code", sql.NVarChar, Code.trim())
      .input("DiscountAmount", sql.Decimal(18, 3), DiscountAmount || null)
      .input(
        "DiscountPercentage",
        sql.Decimal(5, 2),
        DiscountPercentage || null
      )
      .input("MinOrderAmount", sql.Decimal(18, 3), MinOrderAmount || null)
      .input("ExpiryDate", sql.DateTime, ExpiryDate)
      .input("MaxUsage", sql.Int, MaxUsage || null)
      .input("Description", sql.NVarChar, Description || null)
      .query(
        `INSERT INTO Vouchers (Code, DiscountAmount, DiscountPercentage, MinOrderAmount, ExpiryDate, MaxUsage, Description)
         VALUES (@Code, @DiscountAmount, @DiscountPercentage, @MinOrderAmount, @ExpiryDate, @MaxUsage, @Description)`
      );

    res.json({ success: true, message: "Thêm voucher thành công!" });
  } catch (err) {
    console.error("❌ Lỗi thêm voucher:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

// ================== SỬA VOUCHER ==================
router.post("/edit/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const {
      Code,
      DiscountAmount,
      DiscountPercentage,
      MinOrderAmount,
      ExpiryDate,
      MaxUsage,
      Description,
    } = req.body;

    if (!id || !Code || !ExpiryDate)
      return res
        .status(400)
        .json({ success: false, message: "Thiếu dữ liệu bắt buộc" });

    const pool = await poolPromise;

    // Kiểm tra trùng mã (trừ chính nó)
    const check = await pool
      .request()
      .input("Code", sql.NVarChar, Code.trim())
      .input("VoucherId", sql.Int, id)
      .query(
        "SELECT COUNT(*) AS count FROM Vouchers WHERE LOWER(Code) = LOWER(@Code) AND VoucherId != @VoucherId"
      );

    if (check.recordset[0].count > 0)
      return res.json({ success: false, message: "Mã voucher đã tồn tại" });

    await pool
      .request()
      .input("VoucherId", sql.Int, id)
      .input("Code", sql.NVarChar, Code.trim())
      .input("DiscountAmount", sql.Decimal(18, 3), DiscountAmount || null)
      .input(
        "DiscountPercentage",
        sql.Decimal(5, 2),
        DiscountPercentage || null
      )
      .input("MinOrderAmount", sql.Decimal(18, 3), MinOrderAmount || null)
      .input("ExpiryDate", sql.DateTime, ExpiryDate)
      .input("MaxUsage", sql.Int, MaxUsage || null)
      .input("Description", sql.NVarChar, Description || null)
      .query(
        `UPDATE Vouchers 
         SET Code=@Code, DiscountAmount=@DiscountAmount, DiscountPercentage=@DiscountPercentage,
             MinOrderAmount=@MinOrderAmount, ExpiryDate=@ExpiryDate, MaxUsage=@MaxUsage, Description=@Description
         WHERE VoucherId=@VoucherId`
      );

    res.json({ success: true, message: "Cập nhật voucher thành công!" });
  } catch (err) {
    console.error("❌ Lỗi cập nhật voucher:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
}); // ================== NGƯNG KÍCH HOẠT VOUCHER (SOFT DELETE) ==================
router.post("/delete", async (req, res) => {
  try {
    const { id } = req.body;
    if (!id)
      return res.status(400).json({ success: false, message: "Thiếu ID" });

    const pool = await poolPromise;

    // 1️⃣ Kiểm tra voucher có tồn tại không
    const check = await pool
      .request()
      .input("VoucherId", sql.Int, id)
      .query("SELECT * FROM Vouchers WHERE VoucherId = @VoucherId");

    if (!check.recordset.length)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy voucher" });

    // 2️⃣ Kiểm tra voucher đã được cấp cho user nào chưa
    const assignedCheck = await pool
      .request()
      .input("VoucherId", sql.Int, id)
      .query(
        "SELECT COUNT(*) AS Count FROM UserVouchers WHERE VoucherId = @VoucherId"
      );

    if (assignedCheck.recordset[0].Count > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Voucher đã được cấp cho user, không thể xóa hoặc ngưng hoạt động.",
      });
    }

    // 3️⃣ Nếu chưa cấp cho ai -> cho phép ngưng kích hoạt
    await pool
      .request()
      .input("VoucherId", sql.Int, id)
      .query("UPDATE Vouchers SET IsActive = 0 WHERE VoucherId = @VoucherId");

    res.json({
      success: true,
      message: "Voucher đã được ngưng kích hoạt (ẩn khỏi hệ thống).",
    });
  } catch (err) {
    console.error("❌ Lỗi vô hiệu hóa voucher:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

// ================== TOGGLE TRẠNG THÁI VOUCHER ==================
router.put("/toggle/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;

    // Kiểm tra voucher có tồn tại không
    const check = await pool
      .request()
      .input("VoucherId", sql.Int, id)
      .query("SELECT IsActive FROM Vouchers WHERE VoucherId = @VoucherId");

    if (!check.recordset.length) {
      return res
        .status(404)
        .json({ success: false, message: "Voucher không tồn tại" });
    }

    const current = check.recordset[0].IsActive;
    const newStatus = current ? 0 : 1;

    // Cập nhật trạng thái
    await pool
      .request()
      .input("VoucherId", sql.Int, id)
      .input("IsActive", sql.Bit, newStatus)
      .query(
        "UPDATE Vouchers SET IsActive = @IsActive WHERE VoucherId = @VoucherId"
      );

    res.json({
      success: true,
      message: `Voucher đã được ${
        newStatus ? "kích hoạt lại" : "ngừng hoạt động"
      }.`,
    });
  } catch (err) {
    console.error("❌ Lỗi toggle voucher:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

// ================== LẤY VOUCHER THEO ID ==================
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!id)
      return res
        .status(400)
        .json({ success: false, message: "ID không hợp lệ" });

    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("VoucherId", sql.Int, id)
      .query("SELECT * FROM Vouchers WHERE VoucherId = @VoucherId");

    if (!result.recordset.length)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy voucher" });

    res.json({ success: true, data: result.recordset[0] });
  } catch (err) {
    console.error("❌ Lỗi lấy voucher theo ID:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

module.exports = router;
