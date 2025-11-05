// backend/controllers/admin/ingredientController.js
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { Op } = require("sequelize");
const sequelize = require("../../config/sequelize");
const initModels = require("../../models/init-models");

const models = initModels(sequelize);
const { Ingredient, Food, FoodIngredient } = models;

const HOST = "http://localhost:5000";

// ==================== MULTER UPLOAD ====================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../../public/images");
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
exports.upload = multer({ storage });

// ==================== XỬ LÝ LỖI ====================
const handleControllerError = (err, res, uploadedFile = null) => {
  if (uploadedFile) fs.unlink(uploadedFile.path, () => {});
  console.error("❌ Lỗi Controller:", err);
  return res
    .status(500)
    .json({ success: false, message: "Đã xảy ra lỗi server." });
};

// ==================== FORMAT IMAGE URL ====================
const formatImageURL = (imgPath) => {
  if (!imgPath) return `${HOST}/images/no-image.png`;
  return imgPath.startsWith("http") ? imgPath : `${HOST}${imgPath}`;
};

// ==================== LẤY TẤT CẢ NGUYÊN LIỆU ====================
exports.getAllIngredients = async (req, res) => {
  try {
    const ingredients = await Ingredient.findAll({
      order: [["IngredientId", "DESC"]],
      include: [
        {
          model: Food,
          as: "Foods", // <-- PHẢI KHỚP VỚI HASMANY Food alias
          attributes: ["FoodName"],
        },
      ],
    });

    const data = ingredients.map((item) => {
      const plain = item.get({ plain: true });
      plain.Foods = plain.Foods?.map((f) => f.FoodName).join(", ") || "";
      plain.ImageURL = formatImageURL(plain.ImageURL);
      return plain;
    });

    res.json({ success: true, data });
  } catch (err) {
    handleControllerError(err, res);
  }
};

// ==================== LẤY NGUYÊN LIỆU THEO ID ====================
exports.getIngredientById = async (req, res) => {
  try {
    const ingredient = await Ingredient.findByPk(req.params.id, {
      include: [
        {
          model: Food,
          as: "Foods", // <-- PHẢI KHỚP
          attributes: ["FoodId", "FoodName"],
        },
      ],
    });

    if (!ingredient)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy nguyên liệu." });

    const data = ingredient.get({ plain: true });
    const selectedFoods = data.Foods?.map((f) => f.FoodId) || [];
    data.ImageURL = formatImageURL(data.ImageURL);
    delete data.Foods;

    res.json({ success: true, ingredient: data, selectedFoods });
  } catch (err) {
    handleControllerError(err, res);
  }
};

// ==================== THÊM NGUYÊN LIỆU ====================
exports.addIngredient = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { IngredientName, SoLuong, PhanLoai, Foods } = req.body;
    if (!IngredientName || !SoLuong || SoLuong <= 0)
      return res
        .status(400)
        .json({ success: false, message: "Tên hoặc số lượng không hợp lệ." });

    const existing = await Ingredient.findOne({
      where: { IngredientName },
      transaction,
    });
    if (existing)
      return res
        .status(400)
        .json({ success: false, message: "Tên nguyên liệu đã tồn tại." });

    const imageUrl = req.file
      ? `/images/${req.file.filename}`
      : "/images/no-image.png";

    const newIngredient = await Ingredient.create(
      {
        IngredientName,
        SoLuong,
        PhanLoai: PhanLoai || "Khác",
        ImageURL: imageUrl,
      },
      { transaction }
    );

    if (Foods) {
      const foodsArr = JSON.parse(Foods);
      if (Array.isArray(foodsArr) && foodsArr.length) {
        await Food.update(
          { IngredientId: newIngredient.IngredientId },
          { where: { FoodId: foodsArr }, transaction }
        );
      }
    }

    await transaction.commit();

    res.status(201).json({
      success: true,
      message: "Thêm nguyên liệu thành công!",
      data: {
        ...newIngredient.get({ plain: true }),
        ImageURL: formatImageURL(imageUrl),
      },
    });
  } catch (err) {
    await transaction.rollback();
    handleControllerError(err, res, req.file);
  }
};

// ==================== CẬP NHẬT NGUYÊN LIỆU ====================
exports.editIngredient = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const ingredient = await Ingredient.findByPk(req.params.id, {
      transaction,
    });
    if (!ingredient)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy nguyên liệu." });

    const { IngredientName, SoLuong, PhanLoai, Foods } = req.body;
    if (!IngredientName || !SoLuong || SoLuong <= 0)
      return res
        .status(400)
        .json({ success: false, message: "Tên hoặc số lượng không hợp lệ." });

    const existName = await Ingredient.findOne({
      where: { IngredientName, IngredientId: { [Op.ne]: req.params.id } },
      transaction,
    });
    if (existName)
      return res
        .status(400)
        .json({ success: false, message: "Tên nguyên liệu đã tồn tại." });

    const oldImage = ingredient.ImageURL;
    const updateData = {
      IngredientName,
      SoLuong,
      PhanLoai: PhanLoai || "Khác",
    };
    if (req.file) updateData.ImageURL = `/images/${req.file.filename}`;

    await ingredient.update(updateData, { transaction });

    if (Foods) {
      const foodsArr = JSON.parse(Foods);
      if (Array.isArray(foodsArr)) {
        // Cập nhật lại IngredientId của các món ăn
        await Food.update(
          { IngredientId: ingredient.IngredientId },
          { where: { FoodId: foodsArr }, transaction }
        );
      }
    }

    await transaction.commit();

    if (req.file && oldImage && oldImage !== "/images/no-image.png") {
      const oldPath = path.join(__dirname, "../../public", oldImage);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    res.json({
      success: true,
      message: "Cập nhật nguyên liệu thành công!",
      data: {
        ...ingredient.get({ plain: true }),
        ImageURL: formatImageURL(updateData.ImageURL || oldImage),
      },
    });
  } catch (err) {
    await transaction.rollback();
    handleControllerError(err, res, req.file);
  }
};

// ==================== XÓA NGUYÊN LIỆU ====================
exports.deleteIngredient = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.body;
    const ingredient = await Ingredient.findByPk(id, {
      include: [{ model: Food, as: "Foods" }],
      transaction,
    });

    if (!ingredient)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy nguyên liệu." });

    if (ingredient.Foods?.length > 0)
      return res.status(400).json({
        success: false,
        message: `Không thể xóa vì nguyên liệu đang được dùng trong ${ingredient.Foods.length} món ăn.`,
      });

    const imageToDelete = ingredient.ImageURL;
    await ingredient.destroy({ transaction });
    await transaction.commit();

    if (imageToDelete && imageToDelete !== "/images/no-image.png") {
      const imagePath = path.join(__dirname, "../../public", imageToDelete);
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }

    res.json({ success: true, message: "Xóa nguyên liệu thành công!" });
  } catch (err) {
    await transaction.rollback();
    handleControllerError(err, res);
  }
};
