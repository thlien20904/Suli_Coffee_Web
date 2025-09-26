const express = require("express");
const router = express.Router();
const { poolPromise } = require("../../db");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const sql = require("mssql");

// ================== CẤU HÌNH UPLOAD ẢNH ==================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, "../../public/images");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const fileName = Date.now() + ext;
    cb(null, fileName);
  },
});
const upload = multer({ storage });

// ================== API LẤY DANH SÁCH MÓN ĂN ==================
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search?.trim() || "";
    const sort = req.query.sort?.trim() || "";
    const offset = (page - 1) * limit;

    let where = "";
    if (search) where = "WHERE f.FoodName LIKE @search";

    let orderBy = "ORDER BY f.FoodId ASC";
    if (sort === "Price asc") orderBy = "ORDER BY f.Price ASC";
    if (sort === "Price desc") orderBy = "ORDER BY f.Price DESC";

    const pool = await poolPromise;

    // Đếm tổng bản ghi
    const totalQuery = `
      SELECT COUNT(*) AS total
      FROM Food f
      ${where}
    `;
    const reqTotal = pool.request();
    if (search) reqTotal.input("search", `%${search}%`);
    const totalResult = await reqTotal.query(totalQuery);
    const total = totalResult.recordset[0].total;

    // Lấy dữ liệu
    const query = `
      SELECT f.FoodId, f.FoodName, f.Price, f.Discount, f.Stock, f.ImageURL,f.UpdatedDate,
             c.CategoryName,
             STUFF((
                 SELECT ', ' + i.IngredientName
                 FROM FoodIngredient fi
                 JOIN Ingredient i ON fi.IngredientId = i.IngredientId
                 WHERE fi.FoodId = f.FoodId
                 FOR XML PATH(''), TYPE
             ).value('.', 'NVARCHAR(MAX)'),1,2,'') AS Ingredients
      FROM Food f
      LEFT JOIN Category c ON f.CategoryId = c.CategoryId
      ${where}
      ${orderBy}
      OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY
    `;

    const reqData = pool.request();
    if (search) reqData.input("search", `%${search}%`);
    const result = await reqData.query(query);

    // Format ImageURL
    const formattedData = result.recordset.map((item) => {
      if (item.ImageURL) {
        item.ImageURL = `http://localhost:5000${item.ImageURL}`;
      } else {
        item.ImageURL = `http://localhost:5000/images/no-image.png`;
      }
      return item;
    });

    res.json({
      data: formattedData,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("❌ Error GET /api/admin/foods:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ================== API THÊM MÓN ĂN ==================
router.post("/add", upload.single("ImageFile"), async (req, res) => {
  try {
    const {
      FoodName,
      CategoryId,
      Ingredients,
      Price,
      Discount,
      Stock,
      Description,
      Status,
      UpdatedDate,
    } = req.body;

    let imagePath = null;
    if (req.file) {
      // ✅ Lưu đường dẫn tương đối để frontend load qua server
      imagePath = `/images/${req.file.filename}`;
    }

    const pool = await poolPromise;

    // Insert Food
    const result = await pool
      .request()
      .input("FoodName", FoodName)
      .input("CategoryId", CategoryId || null)
      .input("Price", Price)
      .input("Discount", Discount || 0)
      .input("Stock", Stock || 0)
      .input("Description", Description)
      .input("Status", Status === "true" || Status === true ? 1 : 0)
      .input("UpdatedDate", UpdatedDate || new Date())
      .input("ImageURL", imagePath).query(`
        INSERT INTO Food (FoodName, CategoryId, Price, Discount, Stock, Description, Status, UpdatedDate, ImageURL)
        OUTPUT INSERTED.FoodId
        VALUES (@FoodName, @CategoryId, @Price, @Discount, @Stock, @Description, @Status, @UpdatedDate, @ImageURL)
      `);

    const foodId = result.recordset[0].FoodId;

    // Insert Ingredients nếu có
    // Lưu Ingredients (nếu có)
    if (Ingredients) {
      const ingList = JSON.parse(Ingredients);
      for (const ingId of ingList) {
        await pool
          .request()
          .input("FoodId", sql.Int, foodId)
          .input("IngredientId", sql.Int, ingId)
          .input("Quantity", sql.Int, 1) // ✅ Thêm Quantity mặc định = 1
          .query(
            `INSERT INTO FoodIngredient (FoodId, IngredientId, Quantity)
         VALUES (@FoodId, @IngredientId, @Quantity)`
          );
      }
    }

    return res.json({
      success: true,
      message: "Thêm món ăn thành công!",
      foodId,
      imageUrl: imagePath ? `http://localhost:5000${imagePath}` : null,
    });
  } catch (err) {
    console.error("❌ Lỗi thêm món ăn:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

// ================== API LẤY CHI TIẾT 1 MÓN (EDIT FORM) ==================
router.get("/:id", async (req, res) => {
  try {
    const foodId = parseInt(req.params.id);
    if (!foodId)
      return res.status(400).json({ success: false, message: "Invalid id" });

    const pool = await poolPromise;

    // Lấy thông tin món ăn
    const foodResult = await pool.request().input("FoodId", foodId).query(`
        SELECT FoodId, FoodName, CategoryId, Price, Discount, Stock, Description, Status, UpdatedDate, ImageURL
        FROM Food WHERE FoodId = @FoodId
      `);

    if (!foodResult.recordset.length) {
      return res
        .status(404)
        .json({ success: false, message: "Food not found" });
    }
    const food = foodResult.recordset[0];

    // Lấy danh sách nguyên liệu đã chọn
    const ingResult = await pool.request().input("FoodId", foodId).query(`
        SELECT IngredientId, Quantity 
        FROM FoodIngredient WHERE FoodId = @FoodId
      `);

    return res.json({
      success: true,
      food: {
        ...food,
        ImageURL: food.ImageURL
          ? `http://localhost:5000${food.ImageURL}`
          : `http://localhost:5000/images/no-image.png`,
      },
      selectedIngredientIds: ingResult.recordset.map((i) => i.IngredientId),
    });
  } catch (err) {
    console.error("❌ Error GET /foods/:id:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ================== API CẬP NHẬT MÓN ĂN ==================
router.post("/edit/:id", upload.single("ImageFile"), async (req, res) => {
  try {
    const foodId = parseInt(req.params.id);
    if (!foodId || isNaN(foodId))
      return res.status(400).json({ success: false, message: "Invalid id" });

    const {
      FoodName,
      CategoryId,
      Price,
      Discount,
      Stock,
      Description,
      Status,
      Ingredients,
    } = req.body;

    // Kiểm tra Stock
    const stockValue = parseInt(Stock);
    if (!stockValue || stockValue <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Số lượng phải lớn hơn 0." });
    }

    const pool = await poolPromise;

    // Lấy food hiện tại
    const foodResult = await pool
      .request()
      .input("FoodId", sql.Int, foodId)
      .query(`SELECT * FROM Food WHERE FoodId = @FoodId`);

    if (!foodResult.recordset.length) {
      return res
        .status(404)
        .json({ success: false, message: "Món ăn không tồn tại." });
    }
    const oldFood = foodResult.recordset[0];

    // Xử lý ảnh mới
    let imagePath = oldFood.ImageURL;
    if (req.file) {
      // Xóa file cũ nếu có
      if (oldFood.ImageURL) {
        const oldPath = path.join(__dirname, "../../public", oldFood.ImageURL);
        try {
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
          }
        } catch (err) {
          console.warn("Không thể xóa file cũ:", err.message);
        }
      }
      imagePath = `/images/${req.file.filename}`;
    }

    // Update món ăn
    await pool
      .request()
      .input("FoodId", sql.Int, foodId)
      .input("FoodName", sql.NVarChar, FoodName)
      .input("CategoryId", sql.Int, CategoryId || null)
      .input("Price", sql.Decimal(10, 2), Price)
      .input("Discount", sql.Decimal(5, 2), Discount || 0)
      .input("Stock", sql.Int, stockValue)
      .input("Description", sql.NVarChar, Description)
      .input("Status", sql.Bit, Status === "true" || Status === true ? 1 : 0)
      .input("UpdatedDate", sql.DateTime, new Date())
      .input("ImageURL", sql.NVarChar, imagePath).query(`
        UPDATE Food SET
          FoodName = @FoodName,
          CategoryId = @CategoryId,
          Price = @Price,
          Discount = @Discount,
          Stock = @Stock,
          Description = @Description,
          Status = @Status,
          UpdatedDate = @UpdatedDate,
          ImageURL = @ImageURL
        WHERE FoodId = @FoodId
      `);

    // Xóa nguyên liệu cũ
    await pool
      .request()
      .input("FoodId", sql.Int, foodId)
      .query(`DELETE FROM FoodIngredient WHERE FoodId = @FoodId`);

    // Thêm nguyên liệu mới
    if (Ingredients) {
      try {
        const ingList = JSON.parse(Ingredients);
        if (Array.isArray(ingList)) {
          for (const ingId of ingList) {
            await pool
              .request()
              .input("FoodId", sql.Int, foodId)
              .input("IngredientId", sql.Int, ingId)
              .input("Quantity", sql.Int, 1).query(`
                INSERT INTO FoodIngredient (FoodId, IngredientId, Quantity)
                VALUES (@FoodId, @IngredientId, @Quantity)
              `);
          }
        } else {
          throw new Error("Ingredients không phải là mảng hợp lệ");
        }
      } catch (err) {
        console.error("Lỗi xử lý Ingredients:", err.message);
        return res.status(400).json({
          success: false,
          message: "Dữ liệu nguyên liệu không hợp lệ",
        });
      }
    }

    return res.json({ success: true, message: "Cập nhật món ăn thành công!" });
  } catch (err) {
    console.error("❌ Error POST /foods/edit/:id:", err);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
});
// ================== API XÓA MÓN ĂN ==================
router.post("/delete", async (req, res) => {
  let transaction;
  try {
    const { id } = req.body;
    if (!id || isNaN(parseInt(id))) {
      return res
        .status(400)
        .json({ success: false, message: "ID món ăn không hợp lệ" });
    }

    // Bắt đầu transaction
    transaction = new sql.Transaction(await poolPromise);
    await transaction.begin();

    // Kiểm tra món ăn
    const checkRequest = new sql.Request(transaction);
    const foodResult = await checkRequest
      .input("FoodId", sql.Int, id)
      .query(`SELECT * FROM Food WHERE FoodId = @FoodId`);
    if (!foodResult.recordset.length) {
      await transaction.rollback();
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy món ăn." });
    }
    const food = foodResult.recordset[0];

    // Xóa FoodIngredient
    const ingredientRequest = new sql.Request(transaction);
    await ingredientRequest
      .input("FoodId", sql.Int, id)
      .query(`DELETE FROM FoodIngredient WHERE FoodId = @FoodId`);

    // Kiểm tra và xóa Ingredient nếu không dùng ở nơi khác
    const ingredientCheckRequest = new sql.Request(transaction);
    const isIngredientUsedElsewhere = await ingredientCheckRequest
      .input("IngredientId", sql.Int, food.IngredientId)
      .input("FoodId", sql.Int, id).query(`
        SELECT COUNT(*) as count 
        FROM Food 
        WHERE IngredientId = @IngredientId AND FoodId != @FoodId
      `);
    if (
      isIngredientUsedElsewhere.recordset[0].count === 0 &&
      food.IngredientId
    ) {
      const ingredientDeleteRequest = new sql.Request(transaction);
      await ingredientDeleteRequest
        .input("IngredientId", sql.Int, food.IngredientId)
        .query(`DELETE FROM Ingredients WHERE IngredientId = @IngredientId`);
    }

    // Xóa ảnh
    if (food.ImageURL) {
      const fullPath = path.join(__dirname, "../../public", food.ImageURL);
      if (fs.existsSync(fullPath)) {
        try {
          fs.unlinkSync(fullPath);
        } catch (err) {
          console.warn("Không thể xóa file ảnh:", err.message);
        }
      }
    }

    // Xóa món ăn
    const deleteRequest = new sql.Request(transaction);
    await deleteRequest
      .input("FoodId", sql.Int, id)
      .query(`DELETE FROM Food WHERE FoodId = @FoodId`);

    // Commit transaction
    await transaction.commit();

    return res.json({
      success: true,
      message: `Đã xóa món ăn ${food.FoodName} thành công`,
    });
  } catch (err) {
    if (transaction) {
      try {
        await transaction.rollback();
      } catch (rollbackErr) {
        console.error("Lỗi rollback:", rollbackErr);
      }
    }
    console.error("❌ Lỗi khi xóa món ăn:", err);
    return res.status(500).json({
      success: false,
      message: `Lỗi khi xóa sản phẩm: ${err.message}`,
    });
  }
});
module.exports = router;
