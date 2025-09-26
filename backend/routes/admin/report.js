const express = require("express");
const { poolPromise } = require("../../db");
const sql = require("mssql");

const router = express.Router();

/* =====================================================
   1️⃣ DOANH THU (theo tuần / tháng / năm + top 3 SP + 5 năm gần nhất)
   GET /api/admin/report/revenue?year=2025&type=month
   type = week | month | year
===================================================== */
router.get("/revenue", async (req, res) => {
  try {
    const pool = await poolPromise;
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const type = req.query.type || "month";

    let revenueData = [];

    if (type === "day") {
      // Doanh thu theo ngày trong tuần (Thứ 2 → CN)
      const dailyQuery = await pool.request().input("Year", sql.Int, year)
        .query(`
          SELECT 
            DATEPART(WEEKDAY, o.OrderDate) AS DayOfWeek,
            SUM(od.Price * od.Quantity) AS TotalRevenue
          FROM OrderDetails od
          INNER JOIN Orders o ON od.OrderId = o.OrderId
          WHERE YEAR(o.OrderDate) = @Year
          GROUP BY DATEPART(WEEKDAY, o.OrderDate)
        `);

      // SQL Server: 1=Chủ nhật, 2=Thứ 2, ..., 7=Thứ 7
      const mapVN = [2, 3, 4, 5, 6, 7, 1]; // để Thứ 2 bắt đầu
      revenueData = mapVN.map((d) => {
        const found = dailyQuery.recordset.find((x) => x.DayOfWeek === d);
        return { Day: d, TotalRevenue: found ? found.TotalRevenue : 0 };
      });
    }

    if (type === "week") {
      // Doanh thu theo tuần trong tháng
      const weeklyQuery = await pool
        .request()
        .input("Year", sql.Int, year)
        .input("Month", sql.Int, month).query(`
          SELECT 
            DATEPART(WEEK, o.OrderDate) 
              - DATEPART(WEEK, DATEADD(MONTH, DATEDIFF(MONTH, 0, o.OrderDate), 0)) 
              + 1 AS WeekInMonth,
            SUM(od.Price * od.Quantity) AS TotalRevenue
          FROM OrderDetails od
          INNER JOIN Orders o ON od.OrderId = o.OrderId
          WHERE YEAR(o.OrderDate) = @Year AND MONTH(o.OrderDate) = @Month
          GROUP BY DATEPART(WEEK, o.OrderDate) 
              - DATEPART(WEEK, DATEADD(MONTH, DATEDIFF(MONTH, 0, o.OrderDate), 0)) 
              + 1
        `);

      revenueData = Array.from({ length: 5 }, (_, i) => {
        const found = weeklyQuery.recordset.find(
          (x) => x.WeekInMonth === i + 1
        );
        return { Week: i + 1, TotalRevenue: found ? found.TotalRevenue : 0 };
      });
    }

    if (type === "month") {
      // Doanh thu theo tháng trong năm
      const monthlyQuery = await pool.request().input("Year", sql.Int, year)
        .query(`
          SELECT 
            MONTH(o.OrderDate) AS Month,
            SUM(od.Price * od.Quantity) AS TotalRevenue
          FROM OrderDetails od
          INNER JOIN Orders o ON od.OrderId = o.OrderId
          WHERE YEAR(o.OrderDate) = @Year
          GROUP BY MONTH(o.OrderDate)
        `);

      revenueData = Array.from({ length: 12 }, (_, i) => {
        const found = monthlyQuery.recordset.find((x) => x.Month === i + 1);
        return { Month: i + 1, TotalRevenue: found ? found.TotalRevenue : 0 };
      });
    }

    res.json({ success: true, type, year, month, revenueData });
  } catch (err) {
    console.error("❌ Lỗi report revenue:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

/* =====================================================
   2️⃣ TOP SẢN PHẨM BÁN CHẠY (Top 8)
   GET /api/admin/report/banchay
===================================================== */
router.get("/banchay", async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT TOP 8
        f.FoodId, f.FoodName, f.ImageURL, f.Price,
        SUM(od.Quantity) AS TotalSold
      FROM OrderDetails od
      INNER JOIN Food f ON od.FoodId = f.FoodId
      GROUP BY f.FoodId, f.FoodName, f.ImageURL, f.Price
      ORDER BY TotalSold DESC
    `);

    const foods = result.recordset.map((item) => ({
      ...item,
      ImageURL: item.ImageURL
        ? `http://localhost:5000${item.ImageURL}`
        : `http://localhost:5000/images/no-image.png`,
    }));

    res.json({ success: true, data: foods });
  } catch (err) {
    console.error("❌ Lỗi report banchay:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

module.exports = router;
