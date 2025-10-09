const express = require("express");
const router = express.Router();
const { poolPromise } = require("../../db");

/**
 * GET /api/home
 * Trả về:
 *  - products: 8 món ăn mới nhất từ bảng Food
 */
router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;

    // ✅ Lấy 8 món ăn mới nhất
    const foodsQuery = `
      SELECT TOP (8)
        f.FoodId,
        f.FoodName,
        f.Description,
        f.Price,
        f.Discount,
        f.DiscountPrice,
        f.Stock,
        f.ImageURL,
        f.CreatedDate,
        c.CategoryName
      FROM Food f
      LEFT JOIN Category c ON f.CategoryId = c.CategoryId
      ORDER BY f.CreatedDate DESC, f.FoodId DESC;
    `;

    const foodsResult = await pool.request().query(foodsQuery);

    // ✅ Chuẩn hóa dữ liệu trả về
    const products = foodsResult.recordset.map((p) => {
      // Nếu ImageURL có giá trị thì dùng, nếu không fallback
      let imagePath = p.ImageURL;
      if (!imagePath) {
        imagePath = "/images/no-image.png";
      }

      return {
        ProductID: p.FoodId,
        Name: p.FoodName,
        Description: p.Description,
        Price: p.Price,
        DiscountPercent: p.Discount,
        DiscountedPrice: p.DiscountPrice,
        Stock: p.Stock,
        CategoryName: p.CategoryName,
        DefaultImage: imagePath,
        CreatedDate: p.CreatedDate,
      };
    });

    res.json({ products });
  } catch (err) {
    console.error("GET /api/home error:", err);
    res.status(500).json({
      message: "Lỗi server khi lấy dữ liệu trang chủ",
      error: err.message,
    });
  }
});

module.exports = router;
