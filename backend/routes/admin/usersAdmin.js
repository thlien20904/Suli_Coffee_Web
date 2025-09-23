const express = require('express');
const router = express.Router();
const { poolPromise, sql } = require('../../db');

// Danh sách sản phẩm (admin)
router.get('/', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT p.*, c.Name AS CategoryName 
      FROM Products p 
      JOIN Categories c ON p.CategoryID = c.CategoryID
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).send('Lỗi khi lấy danh sách sản phẩm: ' + err.message);
  }
});

module.exports = router;
