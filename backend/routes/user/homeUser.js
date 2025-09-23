const express = require('express');
const router = express.Router();
const { poolPromise, sql } = require('../../db');

/**
 * GET /api/home
 * Trả về:
 *  - products: 8 sản phẩm mới nhất kèm DefaultImage (từ ProductImages)
 *  - blogs: 3 bài viết mới nhất
 */
router.get('/', async (req, res) => {
  try {
    const pool = await poolPromise;

    // Lấy products (top 8 mới nhất), kèm default image và category
    const productsQuery = `
      SELECT TOP (8)
        p.ProductID,
        p.Name,
        p.Description,
        p.Price,
        p.DiscountPercent,
        p.DiscountedPrice,
        c.Name AS CategoryName,
        (SELECT TOP 1 ImageURL FROM ProductImages WHERE ProductID = p.ProductID AND IsDefault = 1) AS DefaultImage
      FROM Products p
      LEFT JOIN Categories c ON p.CategoryID = c.CategoryID
      ORDER BY p.CreatedAt DESC, p.ProductID DESC;
    `;
    const productsResult = await pool.request().query(productsQuery);
    const products = productsResult.recordset.map(p => ({
      ...p,
      // đảm bảo đường dẫn trả về bắt đầu bằng /uploads/... hoặc placeholder
      DefaultImage: p.DefaultImage || '/images/placeholder-product.jpg'
    }));

    // Lấy blogs (top 3)
    const blogsQuery = `
      SELECT TOP (3)
        BlogID,
        Title,
        LEFT(Content, 400) AS Excerpt,
        ImageURL,
        CreatedAt
      FROM Blogs
      ORDER BY CreatedAt DESC, BlogID DESC;
    `;
    const blogsResult = await pool.request().query(blogsQuery);
    const blogs = blogsResult.recordset.map(b => ({
      ...b,
      ImageURL: b.ImageURL || '/images/placeholder-blog.jpg'
    }));

    res.json({ products, blogs });
  } catch (err) {
    console.error('GET /api/home error:', err);
    res.status(500).json({ message: 'Lỗi server khi lấy dữ liệu trang chủ', error: err.message });
  }
});

module.exports = router;
