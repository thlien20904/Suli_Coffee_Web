// routes/api/products.js
const express = require('express');
const router = express.Router();
const { poolPromise, sql } = require('../../db');

/**
 * Map tham số 'category' từ FE -> pattern cho tên Category trong DB.
 * Bạn đang lưu:
 *  - Giày Thể Thao Nam/Nữ
 *  - Giày Công Sở Nam/Nữ
 *  - Giày Sandal Nam/Nữ
 *  - Sneaker Unisex
 */
const mapCategoryToLike = (cat) => {
  switch ((cat || '').toLowerCase()) {
    case 'sport':   return 'Giày Thể Thao%';
    case 'office':  return 'Giày Công Sở%';
    case 'sandal':  return 'Giày Sandal%';
    case 'sneaker': return 'Sneaker%';
    default:        return ''; // không lọc theo danh mục
  }
};

// Chỉ cho phép sắp xếp theo whitelist
const sortToOrderBy = (sort) => {
  switch ((sort || '').toLowerCase()) {
    case 'name_asc':   return 'p.Name ASC';
    case 'name_desc':  return 'p.Name DESC';
    case 'price_asc':  return 'COALESCE(p.DiscountedPrice, p.Price) ASC, p.Price ASC';
    case 'price_desc': return 'COALESCE(p.DiscountedPrice, p.Price) DESC, p.Price DESC';
    default:           return 'p.CreatedAt DESC, p.ProductID DESC';
  }
};

/**
 * GET /api/products
 * Query: page, limit, keyword, category(sport|office|sandal|sneaker), targetGroup(Men|Women|Unisex), sort
 */
router.get('/', async (req, res) => {
  try {
    const page        = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit       = Math.max(parseInt(req.query.limit || '10', 10), 1);
    const offset      = (page - 1) * limit;

    const keyword     = (req.query.keyword || '').trim();
    const category    = (req.query.category || '').trim();
    const targetGroup = (req.query.targetGroup || '').trim();
    const sort        = (req.query.sort || '').trim();

    const pool = await poolPromise;

    // ===== WHERE động (chỉ thêm điều kiện cần thiết) =====
    const where = ['1=1'];
    const listReq = pool.request();

    if (keyword) {
      where.push('(p.Name LIKE @kw OR p.Description LIKE @kw)');
      listReq.input('kw', sql.NVarChar, `%${keyword}%`);
    }

    const catLike = mapCategoryToLike(category);
    if (catLike) {
      // chỉ áp điều kiện vào bảng Categories khi thật sự lọc theo category
      where.push('c.Name LIKE @catLike');
      listReq.input('catLike', sql.NVarChar, catLike);
    }

    if (targetGroup) {
      where.push('c.TargetGroup = @tg');
      listReq.input('tg', sql.NVarChar, targetGroup);
    }

    const orderBy = sortToOrderBy(sort);

    // ===== LƯU Ý: Dùng LEFT JOIN để không bị rơi sản phẩm mồ côi Category =====
    const baseFrom = `
      FROM Products p
      LEFT JOIN Categories c ON p.CategoryID = c.CategoryID
      WHERE ${where.join(' AND ')}
    `;

    // Danh sách có phân trang
    const listSql = `
      SELECT
        p.ProductID,
        p.Name,
        p.Description,
        p.Price,
        p.DiscountPercent,
        COALESCE(p.DiscountedPrice, p.Price) AS DiscountedPrice,
        c.CategoryID,
        c.Name AS CategoryName,
        c.TargetGroup,
        (SELECT TOP 1 ImageURL
           FROM ProductImages i
          WHERE i.ProductID = p.ProductID AND i.IsDefault = 1) AS DefaultImage,
        (SELECT TOP 1 ImageURL
           FROM ProductImages i
          WHERE i.ProductID = p.ProductID AND (i.IsDefault = 0 OR i.IsDefault IS NULL)) AS HoverImage
      ${baseFrom}
      ORDER BY ${orderBy}
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
    `;
    listReq.input('offset', sql.Int, offset).input('limit', sql.Int, limit);

    // Total dùng cùng WHERE (cũng LEFT JOIN)
    const totalReq = pool.request();
    if (keyword)     totalReq.input('kw', sql.NVarChar, `%${keyword}%`);
    if (catLike)     totalReq.input('catLike', sql.NVarChar, catLike);
    if (targetGroup) totalReq.input('tg', sql.NVarChar, targetGroup);

    const totalSql = `SELECT COUNT_BIG(1) AS Total ${baseFrom};`;

    const [listResult, totalResult] = await Promise.all([
      listReq.query(listSql),
      totalReq.query(totalSql),
    ]);

    res.json({
      products: listResult.recordset,
      total: Number(totalResult.recordset[0]?.Total ?? 0),
      page,
      limit,
    });
  } catch (err) {
    console.error('LIST PRODUCTS ERROR:', err);
    res.status(500).send('Lỗi khi lấy danh sách sản phẩm: ' + err.message);
  }
});

/**
 * GET /api/products/:id  — Chi tiết sản phẩm
 */
router.get('/:id', async (req, res) => {
  try {
    const pool = await poolPromise;
    const id = parseInt(req.params.id, 10);

    // Dùng LEFT JOIN để vẫn trả về sản phẩm nếu Category bị thiếu
    const product = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT p.*,
               c.CategoryID,
               c.Name AS CategoryName,
               c.TargetGroup
        FROM Products p
        LEFT JOIN Categories c ON p.CategoryID = c.CategoryID
        WHERE p.ProductID = @id
      `);

    if (!product.recordset.length) {
      return res.status(404).send('Không tìm thấy sản phẩm');
    }

    const variants = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT v.*, i.ImageURL
        FROM ProductVariants v
        LEFT JOIN ProductImages i ON v.VariantID = i.VariantID
        WHERE v.ProductID = @id
      `);

    res.json({ product: product.recordset[0], variants: variants.recordset });
  } catch (err) {
    console.error('PRODUCT DETAIL ERROR:', err);
    res.status(500).send('Lỗi khi lấy chi tiết sản phẩm: ' + err.message);
  }
});

module.exports = router;
