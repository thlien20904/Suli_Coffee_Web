// backend/routes/admin/homeAdmin.js
const express = require("express");
const sql = require("mssql");
const { poolPromise } = require("../../db");
const router = express.Router();

// GET /api/admin/home
router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;

    // 1. Tổng sản phẩm & nguyên liệu
    const totalProducts = (
      await pool.request().query(`SELECT COUNT(*) as cnt FROM Food`)
    ).recordset[0].cnt;

    const totalIngredients = (
      await pool.request().query(`SELECT COUNT(*) as cnt FROM Ingredient`)
    ).recordset[0].cnt;

    // 2. Trạng thái đơn hàng
    const statusRes = await pool.request().query(`SELECT * FROM OrderStatus`);
    const statuses = statusRes.recordset;
    const statusCount = {};
    for (let st of statuses) {
      const count = (
        await pool
          .request()
          .input("sid", sql.Int, st.StatusId)
          .query(`SELECT COUNT(*) as cnt FROM Orders WHERE StatusId = @sid`)
      ).recordset[0].cnt;
      statusCount[st.StatusName] = count;
    }

    const totalOrders = (
      await pool.request().query(`SELECT COUNT(*) as cnt FROM Orders`)
    ).recordset[0].cnt;

    const totalSalesRes = await pool
      .request()
      .query(`SELECT ISNULL(SUM(TotalAmount),0) as total FROM Orders`);
    const totalSales = totalSalesRes.recordset[0].total;

    // 3. Doanh thu theo tháng (năm hiện tại)
    const monthlySalesRes = await pool.request().query(`
      SELECT MONTH(OrderDate) as Month, SUM(TotalAmount) as TotalRevenue
      FROM Orders
      WHERE YEAR(OrderDate) = YEAR(GETDATE())
      GROUP BY MONTH(OrderDate)
      ORDER BY Month
    `);

    const monthlySales = Array.from({ length: 12 }, (_, i) => {
      const found = monthlySalesRes.recordset.find((r) => r.Month === i + 1);
      return {
        Month: i + 1,
        TotalRevenue: found ? parseFloat(found.TotalRevenue) : 0,
      };
    });

    // 4. Sản phẩm bán chạy (top 3) + xử lý ImageURL
    const bestSellersRes = await pool.request().query(`
      SELECT TOP 3 od.FoodId, SUM(od.Quantity) as TotalSold, f.FoodName, f.Price, f.ImageURL
      FROM OrderDetails od
      JOIN Food f ON od.FoodId = f.FoodId
      GROUP BY od.FoodId, f.FoodName, f.Price, f.ImageURL
      ORDER BY TotalSold DESC
    `);

    const bestSellers = bestSellersRes.recordset.map((item) => ({
      ...item,
      ImageURL: item.ImageURL
        ? `http://localhost:5000${item.ImageURL}`
        : `http://localhost:5000/images/no-image.png`,
    }));

    // 5. Nguyên liệu sắp hết (<10)
    const lowStockRes = await pool.request().query(`
      SELECT * FROM Ingredient WHERE SoLuong < 10
    `);

    // 6. Top Address (giả định là quốc gia trong Users.Address)
    const topCountriesRes = await pool.request().query(`
      SELECT TOP 5 ISNULL(u.Address,'Unknown') as Country, COUNT(*) as OrderCount
      FROM Orders o
      JOIN Users u ON o.UserId = u.Id
      GROUP BY u.Address
      ORDER BY OrderCount DESC
    `);

    // 7. Đơn hàng gần đây (5 đơn)
    const recentOrdersRes = await pool.request().query(`
      SELECT TOP 5 o.OrderId, u.FullName, s.StatusName, o.OrderDate, o.TotalAmount
      FROM Orders o
      JOIN Users u ON o.UserId = u.Id
      JOIN OrderStatus s ON o.StatusId = s.StatusId
      ORDER BY o.OrderDate DESC
    `);

    // ✅ Trả JSON kết quả
    res.json({
      totalProducts,
      totalIngredients,
      statusCount,
      totalOrders,
      totalSales,
      monthlySales,
      bestSellers, // đã xử lý ImageURL
      lowStockIngredients: lowStockRes.recordset,
      topCountries: topCountriesRes.recordset,
      recentOrders: recentOrdersRes.recordset,
      customersNeedHelp: [
        {
          CustomerName: "Laila Tazkiah",
          Message: "My order hasn't arrived yet",
          TimeAgo: "1 min ago",
        },
        {
          CustomerName: "Rizal Fakhri",
          Message: "Please cancel my order",
          TimeAgo: "2 hours ago",
        },
        {
          CustomerName: "Syahdan Ubaidillah",
          Message: "Do you see my mother?",
          TimeAgo: "6 hours ago",
        },
      ],
    });
  } catch (err) {
    console.error("Error in /api/admin/home:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
