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
    cb(null, Date.now() + ext);
  },
});
const upload = multer({ storage });

// ================== LẤY DANH SÁCH NGUYÊN LIỆU ==================
router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT i.IngredientId, i.IngredientName, i.SoLuong, i.PhanLoai, i.ImageURL, i.LastUpdated,
             STUFF((
                 SELECT ', ' + f.FoodName
                 FROM FoodIngredient fi
                 JOIN Food f ON fi.FoodId = f.FoodId
                 WHERE fi.IngredientId = i.IngredientId
                 FOR XML PATH(''), TYPE
             ).value('.', 'NVARCHAR(MAX)'),1,2,'') AS Foods
      FROM Ingredient i
      ORDER BY i.IngredientId DESC
    `);

    const data = result.recordset.map((item) => {
      item.ImageURL = item.ImageURL
        ? `http://localhost:5000${item.ImageURL}`
        : `http://localhost:5000/images/no-image.png`;
      return item;
    });

    res.json({ success: true, data });
  } catch (err) {
    console.error("❌ Lỗi GET ingredients:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

// ================== ADD INGREDIENT ==================
router.post("/add", upload.single("ImageFile"), async (req, res) => {
  let transaction;
  try {
    const { IngredientName, SoLuong, PhanLoai, Foods } = req.body;

    if (!IngredientName || SoLuong <= 0) {
      return res.json({
        success: false,
        message: "Tên và số lượng không hợp lệ",
      });
    }

    const pool = await poolPromise;
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    // Ảnh mặc định nếu không upload
    let imagePath = req.file
      ? `/images/${req.file.filename}`
      : "/images/no-image.png";

    // Insert Ingredient
    const insertIngredient = await new sql.Request(transaction)
      .input("IngredientName", sql.NVarChar, IngredientName)
      .input("SoLuong", sql.Int, SoLuong)
      .input("PhanLoai", sql.NVarChar, PhanLoai || "Khác")
      .input("ImageURL", sql.NVarChar, imagePath)
      .input("LastUpdated", sql.DateTime, new Date()).query(`
        INSERT INTO Ingredient (IngredientName, SoLuong, PhanLoai, ImageURL, LastUpdated)
        OUTPUT INSERTED.IngredientId
        VALUES (@IngredientName, @SoLuong, @PhanLoai, @ImageURL, @LastUpdated)
      `);

    const ingredientId = insertIngredient.recordset[0].IngredientId;

    // Insert FoodIngredient
    if (Foods) {
      const foodsArr = JSON.parse(Foods);
      for (const foodId of foodsArr) {
        await new sql.Request(transaction)
          .input("FoodId", sql.Int, foodId)
          .input("IngredientId", sql.Int, ingredientId)
          .input("Quantity", sql.Int, 1).query(`
            INSERT INTO FoodIngredient (FoodId, IngredientId, Quantity)
            VALUES (@FoodId, @IngredientId, @Quantity)
          `);
      }
    }

    await transaction.commit();

    res.json({
      success: true,
      message: "Thêm nguyên liệu thành công",
      ingredientId,
      imageUrl: `http://localhost:5000${imagePath}`,
    });
  } catch (err) {
    if (transaction) await transaction.rollback();
    console.error("❌ Lỗi thêm nguyên liệu:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});
// ================== API LẤY CHI TIẾT 1 NGUYÊN LIỆU ==================
router.get("/:id", async (req, res) => {
  try {
    const ingredientId = parseInt(req.params.id);
    if (!ingredientId || isNaN(ingredientId)) {
      return res
        .status(400)
        .json({ success: false, message: "ID không hợp lệ" });
    }

    const pool = await poolPromise;

    // Lấy thông tin nguyên liệu
    const ingredientResult = await pool
      .request()
      .input("IngredientId", sql.Int, ingredientId).query(`
        SELECT IngredientId, IngredientName, SoLuong, PhanLoai, ImageURL, LastUpdated
        FROM Ingredient WHERE IngredientId = @IngredientId
      `);

    if (!ingredientResult.recordset.length) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy nguyên liệu" });
    }

    const ingredient = ingredientResult.recordset[0];

    // Lấy danh sách món ăn dùng nguyên liệu này
    const foodResult = await pool
      .request()
      .input("IngredientId", sql.Int, ingredientId).query(`
        SELECT FoodId FROM FoodIngredient WHERE IngredientId = @IngredientId
      `);

    return res.json({
      success: true,
      ingredient: {
        ...ingredient,
        ImageURL: ingredient.ImageURL
          ? `http://localhost:5000${ingredient.ImageURL}`
          : `http://localhost:5000/images/no-image.png`,
      },
      selectedFoods: foodResult.recordset.map((f) => f.FoodId),
    });
  } catch (err) {
    console.error("❌ Error GET /ingredients/:id:", err);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

// ================== EDIT INGREDIENT ==================
router.post("/edit/:id", upload.single("ImageFile"), async (req, res) => {
  let transaction;
  try {
    const id = parseInt(req.params.id);
    if (!id || isNaN(id)) {
      return res
        .status(400)
        .json({ success: false, message: "ID không hợp lệ" });
    }

    const { IngredientName, SoLuong, PhanLoai, Foods } = req.body;

    if (!IngredientName || !SoLuong || SoLuong <= 0) {
      return res.status(400).json({
        success: false,
        message: "Tên và số lượng nguyên liệu không hợp lệ",
      });
    }

    const pool = await poolPromise;
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    // Lấy nguyên liệu cũ
    const oldIngredientResult = await new sql.Request(transaction)
      .input("IngredientId", sql.Int, id)
      .query(`SELECT * FROM Ingredient WHERE IngredientId = @IngredientId`);

    if (!oldIngredientResult.recordset.length) {
      await transaction.rollback();
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy nguyên liệu" });
    }
    const oldIngredient = oldIngredientResult.recordset[0];

    // Xử lý ảnh (nếu upload mới thì xóa ảnh cũ, nếu không thì giữ nguyên)
    let imagePath = oldIngredient.ImageURL || "/images/no-image.png";
    if (req.file) {
      if (
        oldIngredient.ImageURL &&
        oldIngredient.ImageURL !== "/images/no-image.png"
      ) {
        const oldPath = path.join(
          __dirname,
          "../../public",
          oldIngredient.ImageURL
        );
        try {
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        } catch (err) {
          console.warn("⚠️ Không thể xóa file ảnh cũ:", err.message);
        }
      }
      imagePath = `/images/${req.file.filename}`;
    }

    // Update Ingredient
    await new sql.Request(transaction)
      .input("IngredientId", sql.Int, id)
      .input("IngredientName", sql.NVarChar, IngredientName)
      .input("SoLuong", sql.Int, SoLuong)
      .input("PhanLoai", sql.NVarChar, PhanLoai || "Khác")
      .input("ImageURL", sql.NVarChar, imagePath)
      .input("LastUpdated", sql.DateTime, new Date()).query(`
        UPDATE Ingredient
        SET IngredientName=@IngredientName,
            SoLuong=@SoLuong,
            PhanLoai=@PhanLoai,
            ImageURL=@ImageURL,
            LastUpdated=@LastUpdated
        WHERE IngredientId=@IngredientId
      `);

    // Xóa liên kết cũ trong FoodIngredient
    await new sql.Request(transaction)
      .input("IngredientId", sql.Int, id)
      .query(`DELETE FROM FoodIngredient WHERE IngredientId=@IngredientId`);

    // Thêm lại FoodIngredient mới (nếu có)
    if (Foods) {
      try {
        const foodsArr = JSON.parse(Foods);
        if (Array.isArray(foodsArr)) {
          for (const foodId of foodsArr) {
            await new sql.Request(transaction)
              .input("FoodId", sql.Int, foodId)
              .input("IngredientId", sql.Int, id)
              .input("Quantity", sql.Int, 1).query(`
                INSERT INTO FoodIngredient (FoodId, IngredientId, Quantity)
                VALUES (@FoodId, @IngredientId, @Quantity)
              `);
          }
        }
      } catch (err) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "Dữ liệu Foods không hợp lệ",
        });
      }
    }

    await transaction.commit();
    return res.json({
      success: true,
      message: "Cập nhật nguyên liệu thành công",
    });
  } catch (err) {
    if (transaction) await transaction.rollback();
    console.error("❌ Lỗi edit ingredient:", err);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

// ================== DELETE INGREDIENT ==================
router.post("/delete", async (req, res) => {
  let transaction;
  try {
    const { id } = req.body;
    if (!id) return res.json({ success: false, message: "ID không hợp lệ" });

    const pool = await poolPromise;
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    // Lấy ingredient
    const ingredientResult = await new sql.Request(transaction)
      .input("IngredientId", sql.Int, id)
      .query(`SELECT * FROM Ingredient WHERE IngredientId = @IngredientId`);

    if (!ingredientResult.recordset.length) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy nguyên liệu" });
    }
    const ingredient = ingredientResult.recordset[0];

    // Xóa FoodIngredient liên quan
    await new sql.Request(transaction)
      .input("IngredientId", sql.Int, id)
      .query(`DELETE FROM FoodIngredient WHERE IngredientId=@IngredientId`);

    // Xóa ảnh (nếu không phải ảnh mặc định)
    if (ingredient.ImageURL && ingredient.ImageURL !== "/images/no-image.png") {
      const fullPath = path.join(
        __dirname,
        "../../public",
        ingredient.ImageURL
      );
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    }

    // Xóa Ingredient
    await new sql.Request(transaction)
      .input("IngredientId", sql.Int, id)
      .query(`DELETE FROM Ingredient WHERE IngredientId=@IngredientId`);

    await transaction.commit();

    res.json({
      success: true,
      message: `Đã xóa nguyên liệu ${ingredient.IngredientName}`,
    });
  } catch (err) {
    if (transaction) await transaction.rollback();
    console.error("❌ Lỗi delete ingredient:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

module.exports = router;
