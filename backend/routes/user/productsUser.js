const express = require('express');
const router = express.Router();
const { poolPromise, sql } = require('../../db');

// ================== HÀM HỖ TRỢ ==================
const mapCategoryToLike = (cat) => {
  switch ((cat || '').toLowerCase()) {
    case 'coffee':    return 'Cà phê%';
    case 'milktea':   return 'Trà sữa%';
    case 'frappe':    return 'Thức uống đá xay%';
    case 'snack':     return 'Bánh & Snack%';
    case 'fruittea':  return 'Trà trái cây%';
    default:          return '';
  }
};

const sortToOrderBy = (sort) => {
  switch ((sort || '').toLowerCase()) {
    case 'name_asc':   return 'f.FoodName ASC';
    case 'name_desc':  return 'f.FoodName DESC';
    case 'price_asc':  return 'ISNULL(f.DiscountPrice, f.Price * (1 - ISNULL(f.Discount, 0) / 100.0)) ASC, f.Price ASC';
    case 'price_desc': return 'ISNULL(f.DiscountPrice, f.Price * (1 - ISNULL(f.Discount, 0) / 100.0)) DESC, f.Price DESC';
    case 'id_asc':     return 'f.FoodId ASC'; 
    // Mặc định: Sắp xếp theo FoodId ASC để hiển thị từ 1 đến 35
    default:           return 'f.FoodId ASC';
  }
};

// ================== DANH SÁCH SP ==================
router.get('/', async (req, res) => {
  try {
    const page   = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit  = Math.max(parseInt(req.query.limit || '10', 10), 1);
    const offset = (page - 1) * limit;

    const keyword  = (req.query.keyword || '').trim();
    const category = (req.query.category || '').trim();
    const sort     = (req.query.sort || '').trim(); 
    const minPrice = parseFloat(req.query.minPrice) || null;
    const maxPrice = parseFloat(req.query.maxPrice) || null;

    const pool = await poolPromise;

    const where = ['1=1'];
    const listReq = pool.request();

    if (keyword) {
      where.push('(f.FoodName LIKE @kw OR f.Description LIKE @kw)');
      listReq.input('kw', sql.NVarChar, `%${keyword}%`);
    }

    const catLike = mapCategoryToLike(category);
    if (catLike) {
      where.push('c.CategoryName LIKE @catLike');
      listReq.input('catLike', sql.NVarChar, catLike);
    }

    if (minPrice !== null && !isNaN(minPrice)) {
      where.push('ISNULL(f.DiscountPrice, f.Price * (1 - ISNULL(f.Discount, 0) / 100.0)) >= @minPrice');
      listReq.input('minPrice', sql.Decimal(18, 2), minPrice);
    }
    if (maxPrice !== null && !isNaN(maxPrice)) {
      where.push('ISNULL(f.DiscountPrice, f.Price * (1 - ISNULL(f.Discount, 0) / 100.0)) <= @maxPrice');
      listReq.input('maxPrice', sql.Decimal(18, 2), maxPrice);
    }

    const orderBy = sortToOrderBy(sort);

    const baseFrom = `
      FROM Food f
      LEFT JOIN Category c ON f.CategoryId = c.CategoryId
      WHERE ${where.join(' AND ')}
    `;

    const listSql = `
      SELECT f.FoodId, f.FoodName, f.Description,
             f.Price, f.Discount,
             ISNULL(f.DiscountPrice, f.Price * (1 - ISNULL(f.Discount, 0) / 100.0)) AS DiscountPrice,
             f.Stock, f.CreatedDate, f.UpdatedDate,
             f.Status, f.ImageURL,
             c.CategoryId, c.CategoryName
      ${baseFrom}
      ORDER BY ${orderBy}
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
    `;
    listReq.input('offset', sql.Int, offset).input('limit', sql.Int, limit);

    const totalReq = pool.request();
    if (keyword) totalReq.input('kw', sql.NVarChar, `%${keyword}%`);
    if (catLike) totalReq.input('catLike', sql.NVarChar, catLike);
    if (minPrice !== null && !isNaN(minPrice)) {
      totalReq.input('minPrice', sql.Decimal(18, 2), minPrice);
    }
    if (maxPrice !== null && !isNaN(maxPrice)) {
      totalReq.input('maxPrice', sql.Decimal(18, 2), maxPrice);
    }

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
      totalPages: Math.ceil(Number(totalResult.recordset[0]?.Total ?? 0) / limit)
    });
  } catch (err) {
    console.error('LIST PRODUCTS ERROR:', err);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách món ăn', detail: err.message });
  }
});

// ================== CHI TIẾT SP ==================
router.get('/:id', async (req, res) => {
  try {
    const pool = await poolPromise;
    const id = parseInt(req.params.id, 10);

    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: 'ID sản phẩm không hợp lệ.' });
    }

    const productRes = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT f.FoodId, f.FoodName, f.Description, f.Price, f.Discount, 
               ISNULL(f.DiscountPrice, f.Price * (1 - ISNULL(f.Discount, 0) / 100.0)) AS DiscountPrice,
               f.Stock, f.ImageURL, f.Status,
               c.CategoryId, c.CategoryName
        FROM Food f
        LEFT JOIN Category c ON f.CategoryId = c.CategoryId
        WHERE f.FoodId = @id
      `);

    if (!productRes.recordset.length) {
      return res.status(404).json({ error: 'Không tìm thấy món ăn.' });
    }

    const product = productRes.recordset[0];

    const sizesRes = await pool.request().query(`
      SELECT SizeID, SizeName, ExtraPrice 
      FROM Size ORDER BY ExtraPrice ASC
    `);

    const toppingsRes = await pool.request().query(`
      SELECT ToppingID, ToppingName, ToppingPrice 
      FROM Topping ORDER BY ToppingName ASC
    `);

    let related = [];
    if (product.CategoryId) {
      const relatedRes = await pool.request()
        .input('catId', sql.Int, product.CategoryId)
        .input('id', sql.Int, id)
        .query(`
          SELECT TOP 4 f.FoodId, f.FoodName, f.Price, 
                 ISNULL(f.DiscountPrice, f.Price * (1 - ISNULL(f.Discount, 0) / 100.0)) AS DiscountPrice, 
                 f.ImageURL, c.CategoryName
          FROM Food f
          LEFT JOIN Category c ON f.CategoryId = c.CategoryId
          WHERE f.CategoryId = @catId AND f.FoodId <> @id
          ORDER BY NEWID();
        `);
      related = relatedRes.recordset;
    }

    res.json({
      product,
      sizes: sizesRes.recordset,
      toppings: toppingsRes.recordset,
      related
    });
  } catch (err) {
    console.error('PRODUCT DETAIL ERROR:', err);
    res.status(500).json({ error: 'Lỗi khi lấy chi tiết món ăn', detail: err.message });
  }
});

module.exports = router;