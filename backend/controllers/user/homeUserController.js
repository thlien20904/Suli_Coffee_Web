const sequelize = require("../../config/sequelize");
const initModels = require("../../models/init-models");
const models = initModels(sequelize);
const { Food, Category, OrderDetails } = models;

exports.getHomeData = async (req, res) => {
  try {
    // Lấy tất cả món ăn kèm chi tiết OrderDetails
    const foods = await Food.findAll({
      include: [
        {
          model: OrderDetails,
          as: "OrderDetails",
          attributes: ["Quantity"], // Chỉ lấy số lượng
        },
        {
          model: Category,
          as: "Category",
          attributes: ["CategoryName"],
        },
      ],
    });

    // Tính tổng đã bán cho từng món
    const products = foods
      .map((f) => {
        const totalSold = f.OrderDetails
          ? f.OrderDetails.reduce((sum, od) => sum + (od.Quantity || 0), 0)
          : 0;

        return {
          ProductID: f.FoodId,
          Name: f.FoodName,
          Description: f.Description,
          Price: parseFloat(f.Price),
          DiscountPercent: f.Discount ? parseFloat(f.Discount) : null,
          DiscountedPrice: f.DiscountPrice ? parseFloat(f.DiscountPrice) : null,
          SoldQuantity: totalSold, // ✅ Gán số lượng đã bán
          CategoryName: f.Category ? f.Category.CategoryName : null,
          DefaultImage: f.ImageURL ? f.ImageURL : "/images/no-image.png",
        };
      })
      .sort((a, b) => b.SoldQuantity - a.SoldQuantity) // sắp xếp từ nhiều đến ít
      .slice(0, 8); // lấy 8 món bán chạy nhất

    res.json({ success: true, data: products });
  } catch (err) {
    console.error("❌ Lỗi lấy dữ liệu trang chủ:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};
