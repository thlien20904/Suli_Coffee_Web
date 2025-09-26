const express = require("express");
const { poolPromise } = require("../../db");
const sql = require("mssql");
const router = express.Router();

/* =====================================================
   1️⃣ LẤY DANH SÁCH HÓA ĐƠN
===================================================== */
router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;
    const { page = 1, limit = 10, search = "" } = req.query;

    const offset = (page - 1) * limit;
    const searchQuery = `%${search}%`;

    const result = await pool
      .request()
      .input("Search", sql.NVarChar, searchQuery).query(`
        SELECT o.OrderId, o.OrderDate, o.TotalAmount,
               u.FullName AS UserName,
               ptt.TenPhuongThuc AS PaymentMethod,
               s.StatusName AS Status
        FROM Orders o
        INNER JOIN Users u ON o.UserId = u.Id
        INNER JOIN PhuongThucThanhToan ptt ON o.PaymentMethodId = ptt.Id
        INNER JOIN OrderStatus s ON o.StatusId = s.StatusId
        WHERE o.OrderId LIKE @Search OR u.FullName LIKE @Search
        ORDER BY o.OrderId DESC
        OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY
      `);

    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error("❌ Lỗi lấy danh sách hóa đơn:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

/* =====================================================
   2️⃣ LẤY CHI TIẾT 1 HÓA ĐƠN
===================================================== */
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!id)
      return res
        .status(400)
        .json({ success: false, message: "ID không hợp lệ" });

    const pool = await poolPromise;

    const invoice = await pool.request().input("Id", sql.Int, id).query(`
        SELECT o.*, 
               u.FullName AS UserName,
               ptt.TenPhuongThuc AS PaymentMethod,
               s.StatusName AS Status
        FROM Orders o
        INNER JOIN Users u ON o.UserId = u.Id
        INNER JOIN PhuongThucThanhToan ptt ON o.PaymentMethodId = ptt.Id
        INNER JOIN OrderStatus s ON o.StatusId = s.StatusId
        WHERE o.OrderId = @Id
      `);

    if (!invoice.recordset.length)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy hóa đơn" });

    const details = await pool.request().input("Id", sql.Int, id).query(`
        SELECT d.OrderDetailId, d.Quantity, d.Price,
               f.FoodName,
               sz.SizeName,
               tp.ToppingName
        FROM OrderDetails d
        INNER JOIN Food f ON d.FoodId = f.FoodId
        LEFT JOIN Size sz ON d.SizeId = sz.SizeID
        LEFT JOIN Topping tp ON d.ToppingId = tp.ToppingID
        WHERE d.OrderId = @Id
      `);

    res.json({
      success: true,
      invoice: invoice.recordset[0],
      details: details.recordset,
    });
  } catch (err) {
    console.error("❌ Lỗi lấy chi tiết hóa đơn:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

module.exports = router;
