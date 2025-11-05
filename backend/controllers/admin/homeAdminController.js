const sequelize = require("../../config/sequelize");
const initModels = require("../../models/init-models");
const models = initModels(sequelize);
const { Sequelize, Op } = require("sequelize");

const { Food, Ingredient, Orders, OrderStatus, OrderDetails, Users } = models;

/* =====================================================
   📊 DASHBOARD HOME ADMIN
   GET /api/admin/home
===================================================== */
exports.getHome = async (req, res) => {
  try {
    // 1. Tổng sản phẩm & nguyên liệu
    const [totalProducts, totalIngredients] = await Promise.all([
      Food.count(),
      Ingredient.count(),
    ]);

    // 2. Trạng thái đơn hàng
    const statuses = await OrderStatus.findAll();
    const statusCount = {};
    for (const st of statuses) {
      const count = await Orders.count({ where: { StatusId: st.StatusId } });
      statusCount[st.StatusName] = count;
    }

    // Tổng đơn hàng và doanh thu
    const [totalOrders, totalSalesRes] = await Promise.all([
      Orders.count(),
      Orders.sum("TotalAmount"),
    ]);
    const totalSales = totalSalesRes || 0;

    // 3. Doanh thu theo tháng (năm hiện tại)
    const currentYear = new Date().getFullYear();
    const monthlySales = await Orders.findAll({
      attributes: [
        [Sequelize.fn("MONTH", Sequelize.col("OrderDate")), "Month"],
        [Sequelize.fn("SUM", Sequelize.col("TotalAmount")), "TotalRevenue"],
      ],
      where: {
        OrderDate: {
          [Op.gte]: `${currentYear}-01-01`,
          [Op.lte]: `${currentYear}-12-31`,
        },
      },
      group: [Sequelize.fn("MONTH", Sequelize.col("OrderDate"))],
      order: [[Sequelize.fn("MONTH", Sequelize.col("OrderDate")), "ASC"]],
    });

    const monthlySalesArray = Array.from({ length: 12 }, (_, i) => {
      const found = monthlySales.find((r) => r.dataValues.Month === i + 1);
      return {
        Month: i + 1,
        TotalRevenue: found ? parseFloat(found.dataValues.TotalRevenue) : 0,
      };
    });

    // 4. Sản phẩm bán chạy (top 3) - Separate query to avoid group with include
    const topFoodIds = await OrderDetails.findAll({
      attributes: [
        "FoodId",
        [Sequelize.fn("SUM", Sequelize.col("Quantity")), "TotalSold"],
      ],
      group: ["FoodId"],
      order: [[Sequelize.col("TotalSold"), "DESC"]],
      limit: 3,
    });

    const bestSellersProcessed = await Promise.all(
      topFoodIds.map(async (item) => {
        const food = await Food.findByPk(item.FoodId, {
          attributes: ["FoodName", "Price", "ImageURL"],
        });
        return {
          FoodId: item.FoodId,
          TotalSold: parseInt(item.dataValues.TotalSold),
          FoodName: food ? food.FoodName : "N/A",
          Price: food ? food.Price : 0,
          ImageURL:
            food && food.ImageURL
              ? `http://localhost:5000${food.ImageURL}`
              : `http://localhost:5000/images/no-image.png`,
        };
      })
    );

    // 5. Nguyên liệu sắp hết (<10)
    const lowStock = await Ingredient.findAll({
      where: { SoLuong: { [Op.lt]: 10 } },
    });

    const lowStockProcessed = lowStock.map((item) => ({
      ...item.dataValues,
      ImageURL: item.ImageURL
        ? `http://localhost:5000${item.ImageURL}`
        : `http://localhost:5000/images/no-image.png`,
    }));

    // 6. Top Address (GROUP BY Address in Users) - Raw SQL fix for MSSQL
    const topAddressesRaw = await sequelize.query(
      `
  SELECT TOP 5 
    ISNULL(u.Address, 'Unknown') AS Address,
    COUNT(o.OrderId) AS OrderCount
  FROM dbo.Users u
  LEFT JOIN dbo.Orders o ON u.Id = o.UserId
  WHERE u.Address IS NOT NULL
  GROUP BY u.Address
  ORDER BY OrderCount DESC;
`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    const topAddressesProcessed = topAddressesRaw.map((item) => ({
      Address: item.Address,
      OrderCount: parseInt(item.OrderCount),
    }));

    // 7. Đơn hàng gần đây (top 5)
    const recentOrders = await Orders.findAll({
      attributes: ["OrderId", "OrderDate", "TotalAmount", "StatusId"],
      include: [
        { model: Users, as: "User", attributes: ["FullName"], required: true },
        {
          model: OrderStatus,
          as: "Status",
          attributes: ["StatusName"],
          required: true,
        },
      ],
      order: [["OrderDate", "DESC"]],
      limit: 5,
    });

    const recentOrdersProcessed = recentOrders.map((item) => ({
      OrderId: item.OrderId,
      FullName: item.User.FullName,
      StatusName: item.Status.StatusName,
      OrderDate: item.OrderDate,
      TotalAmount: item.TotalAmount,
    }));

    // Hardcoded customers need help
    const customersNeedHelp = [
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
    ];

    res.json({
      totalProducts,
      totalIngredients,
      statusCount,
      totalOrders,
      totalSales,
      monthlySales: monthlySalesArray,
      bestSellers: bestSellersProcessed,
      lowStockIngredients: lowStockProcessed,
      topAddresses: topAddressesProcessed,
      recentOrders: recentOrdersProcessed,
      customersNeedHelp,
    });
  } catch (err) {
    console.error("❌ Lỗi dashboard home admin:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};
