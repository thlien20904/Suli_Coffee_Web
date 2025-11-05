const { Op } = require("sequelize");
const Sequelize = require("sequelize"); // Thêm import Sequelize
const Food = require("../../models/Food");
const InvoiceDetail = require("../../models/InvoiceDetail");

exports.getHome = async (req, res) => {
  try {
    console.log("Fetching best sellers...");
    const bestSellers = await InvoiceDetail.findAll({
      where: { FoodId: { [Op.not]: null } },
      attributes: [
        "FoodId",
        [Sequelize.fn("SUM", Sequelize.col("SoLuong")), "TotalSold"],
      ],
      group: ["FoodId"],
      order: [[Sequelize.literal("TotalSold"), "DESC"]],
      limit: 8,
    }).then(async (results) => {
      console.log("InvoiceDetail results:", results);
      return Promise.all(
        results.map(async (result) => {
          const food = await Food.findByPk(result.FoodId);
          console.log("Food found for FoodId:", result.FoodId, food);
          return {
            FoodId: result.FoodId,
            FoodName: food ? food.FoodName : "Không có tên",
            ImageUrl: food
              ? `/assets/images/${food.ImageURL}`
              : "images/no-image.png",
            Price: food ? food.Price || 0 : 0,
            TotalSold: result.dataValues.TotalSold || 0,
          };
        })
      );
    });

    if (!bestSellers || bestSellers.length === 0) {
      console.log("No best sellers found.");
    }
    res.status(200).json({ bestSellers });
  } catch (error) {
    console.error("Error in getHome:", error);
    res.status(500).json({ message: "Lỗi tải dữ liệu", error: error.message });
  }
};

exports.getCartCount = async (req, res) => {
  try {
    console.log("Fetching cart count for user:", req.user);
    const cartCount =
      req.user && req.user.cartItems ? req.user.cartItems.length : 0;
    res.status(200).json({ count: cartCount });
  } catch (error) {
    console.error("Error in getCartCount:", error);
    res
      .status(404)
      .json({ message: "Lỗi tải số lượng giỏ hàng", error: error.message });
  }
};
