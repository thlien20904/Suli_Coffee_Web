const express = require("express");
const { poolPromise } = require("../../db");
const sql = require("mssql");

const router = express.Router();

/* =====================================================
   1️⃣ LẤY DANH SÁCH ĐƠN HÀNG
===================================================== */
router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT 
        o.OrderId,
        o.OrderDate,
        o.TotalAmount,
        u.FullName AS UserName,
        o.StatusId,                 -- lấy luôn id để FE set select
        s.StatusName AS Status
      FROM Orders o
      INNER JOIN Users u ON o.UserId = u.Id
      INNER JOIN OrderStatus s ON o.StatusId = s.StatusId
      ORDER BY o.OrderDate DESC
    `);

    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error("❌ Lỗi lấy danh sách đơn hàng:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

/* =====================================================
   2️⃣ CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG
===================================================== */
router.post("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { statusId } = req.body;

    if (!id || !statusId) {
      return res
        .status(400)
        .json({ success: false, message: "Thiếu dữ liệu!" });
    }

    const pool = await poolPromise;

    // Kiểm tra đơn hàng tồn tại
    const order = await pool
      .request()
      .input("Id", sql.Int, id)
      .query("SELECT OrderId FROM Orders WHERE OrderId = @Id");

    if (!order.recordset.length) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy đơn hàng!" });
    }

    // Kiểm tra trạng thái tồn tại
    const status = await pool
      .request()
      .input("StatusId", sql.Int, statusId)
      .query("SELECT * FROM OrderStatus WHERE StatusId = @StatusId");

    if (!status.recordset.length) {
      return res
        .status(400)
        .json({ success: false, message: "Trạng thái không hợp lệ!" });
    }

    // Update trạng thái
    await pool
      .request()
      .input("Id", sql.Int, id)
      .input("StatusId", sql.Int, statusId)
      .query("UPDATE Orders SET StatusId = @StatusId WHERE OrderId = @Id");

    res.json({
      success: true,
      message: "Cập nhật trạng thái thành công!",
      newStatus: {
        StatusId: status.recordset[0].StatusId,
        StatusName: status.recordset[0].StatusName,
      },
    });
  } catch (err) {
    console.error("❌ Lỗi cập nhật trạng thái:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

module.exports = router;
