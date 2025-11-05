const sequelize = require("../../config/sequelize");
const initModels = require("../../models/init-models");
const models = initModels(sequelize);
const { Op } = require("sequelize");
const jwt = require("jsonwebtoken");

const { GioHang, GioHang_Topping, Food, Size, Topping, Users } = models;

// =========================
// MIDDLEWARE XÁC THỰC JWT
// =========================
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Bạn chưa đăng nhập!" });
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET || "dev_secret_fallback",
    (err, user) => {
      if (err) {
        return res
          .status(403)
          .json({ success: false, message: "Token không hợp lệ!" });
      }
      req.user = user;
      next();
    }
  );
};

// =========================
// HELPER: SO SÁNH MẢNG TOPPING
// =========================
const equalArrayNumbers = (a = [], b = []) => {
  const aa = a.map(Number).sort((x, y) => x - y);
  const bb = b.map(Number).sort((x, y) => x - y);
  if (aa.length !== bb.length) return false;
  for (let i = 0; i < aa.length; i++) if (aa[i] !== bb[i]) return false;
  return true;
};

// =========================
// HELPER: ĐỊNH DẠNG ITEM GIỎ HÀNG
// =========================
const formatCartItem = (item) => ({
  GioHangID: item.GioHangID,
  SoLuong: item.SoLuong,
  TotalPrice: parseFloat(item.TotalPrice),
  FoodId: item.Food.FoodId,
  FoodName: item.Food.FoodName,
  Price: parseFloat(item.Food.Price),
  DiscountPrice: item.Food.DiscountPrice
    ? parseFloat(item.Food.DiscountPrice)
    : null,
  ImageURL: item.Food.ImageURL || "/images/no-image.png",
  SizeID: item.Size?.SizeID,
  SizeName: item.Size?.SizeName,
  ExtraPrice: item.Size?.ExtraPrice ? parseFloat(item.Size.ExtraPrice) : null,
  Toppings:
    item.GioHang_Toppings?.map((gt) => ({
      ToppingID: gt.Topping.ToppingID,
      ToppingName: gt.Topping.ToppingName,
      ToppingPrice: parseFloat(gt.Topping.ToppingPrice),
    })) || [],
});

// =========================
// THÊM SẢN PHẨM VÀO GIỎ HÀNG
// =========================
exports.addToCart = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const foodId = parseInt(req.body.productId ?? req.body.foodId, 10);
    const soLuong = parseInt(req.body.quantity ?? req.body.soLuong, 10);
    let sizeId = req.body.sizeId ?? req.body.SizeId ?? null;
    const toppingIds = Array.isArray(req.body.toppingIds)
      ? req.body.toppingIds.map(Number)
      : [];

    if (!foodId || !soLuong || soLuong <= 0) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Thiếu hoặc sai thông tin sản phẩm / số lượng",
        });
    }

    sizeId = sizeId === 0 ? null : parseInt(sizeId, 10) || null;
    const userId = req.user.id;

    // 1. Lấy food
    const food = await Food.findByPk(foodId, {
      attributes: ["FoodId", "Price", "DiscountPrice", "Stock"],
      transaction: t,
    });
    if (!food) {
      return res
        .status(404)
        .json({ success: false, message: "Sản phẩm không tồn tại" });
    }

    if (food.Stock !== null && food.Stock < soLuong) {
      return res
        .status(400)
        .json({ success: false, message: "Số lượng vượt quá tồn kho" });
    }

    const basePrice =
      food.DiscountPrice && food.DiscountPrice > 0
        ? food.DiscountPrice
        : food.Price;

    // 2. Lấy size
    let sizePrice = 0;
    if (sizeId) {
      const size = await Size.findByPk(sizeId, { transaction: t });
      if (!size) {
        return res
          .status(400)
          .json({ success: false, message: "Size không hợp lệ" });
      }
      sizePrice = Number(size.ExtraPrice || 0);
    }

    // 3. Tổng topping
    let toppingTotal = 0;
    const safeToppingIds = toppingIds.filter(Number.isInteger);
    if (safeToppingIds.length > 0) {
      const toppings = await Topping.findAll({
        where: { ToppingID: safeToppingIds },
        attributes: ["ToppingPrice"],
        transaction: t,
      });
      toppingTotal = toppings.reduce(
        (sum, t) => sum + Number(t.ToppingPrice || 0),
        0
      );
    }

    const itemTotalPrice = (basePrice + sizePrice + toppingTotal) * soLuong;

    // 4. Tìm giỏ trùng
    const existingCarts = await GioHang.findAll({
      where: {
        Id: userId,
        FoodId: foodId,
        SizeID: sizeId ?? null,
      },
      include: [
        {
          model: GioHang_Topping,
          as: "GioHang_Toppings",
          attributes: ["ToppingID"],
        },
      ],
      transaction: t,
    });

    let matchedCart = null;
    for (const cart of existingCarts) {
      const existingIds = cart.GioHang_Toppings.map((t) => t.ToppingID);
      if (equalArrayNumbers(existingIds, safeToppingIds)) {
        matchedCart = cart;
        break;
      }
    }

    if (matchedCart) {
      await matchedCart.update(
        {
          SoLuong: matchedCart.SoLuong + soLuong,
          TotalPrice: Number(matchedCart.TotalPrice) + itemTotalPrice,
        },
        { transaction: t }
      );
    } else {
      const newCart = await GioHang.create(
        {
          Id: userId,
          FoodId: foodId,
          SoLuong: soLuong,
          SizeID: sizeId,
          TotalPrice: itemTotalPrice,
        },
        { transaction: t }
      );

      if (safeToppingIds.length > 0) {
        const records = safeToppingIds.map((tid) => ({
          GioHangID: newCart.GioHangID,
          ToppingID: tid,
        }));
        await GioHang_Topping.bulkCreate(records, { transaction: t });
      }
    }

    await t.commit();

    const totalQty = await GioHang.sum("SoLuong", { where: { Id: userId } });
    const cartCount = totalQty ?? 0;

    res.json({
      success: true,
      message: "Đã thêm vào giỏ hàng!",
      cartCount,
    });
  } catch (err) {
    await t.rollback();
    console.error("ADD TO CART ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi thêm vào giỏ!",
      detail: err.message,
    });
  }
};

// =========================
// LẤY GIỎ HÀNG
// =========================
exports.getCart = async (req, res) => {
  try {
    const userId = req.user.id;

    const items = await GioHang.findAll({
      where: { Id: userId },
      attributes: ["GioHangID", "SoLuong", "TotalPrice"],
      include: [
        {
          model: Food,
          as: "Food",
          attributes: [
            "FoodId",
            "FoodName",
            "Price",
            "DiscountPrice",
            "ImageURL",
          ],
        },
        {
          model: Size,
          as: "Size",
          attributes: ["SizeID", "SizeName", "ExtraPrice"],
          required: false,
        },
        {
          model: GioHang_Topping,
          as: "GioHang_Toppings",
          attributes: [],
          include: [
            {
              model: Topping,
              as: "Topping",
              attributes: ["ToppingID", "ToppingName", "ToppingPrice"],
            },
          ],
        },
      ],
      order: [["GioHangID", "DESC"]],
    });

    const cart = items.map(formatCartItem);

    res.json({
      success: true,
      message: "Lấy giỏ hàng thành công!",
      cart,
    });
  } catch (err) {
    console.error("GET CART ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy giỏ hàng!",
      detail: err.message,
    });
  }
};

// =========================
// CẬP NHẬT SỐ LƯỢNG
// =========================
exports.updateCart = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { gioHangId, quantity } = req.body;
    const qty = parseInt(quantity, 10);
    const userId = req.user.id;

    if (!gioHangId || isNaN(qty) || qty < 1) {
      return res
        .status(400)
        .json({ success: false, message: "Dữ liệu không hợp lệ" });
    }

    const cartItem = await GioHang.findByPk(gioHangId, {
      include: [
        { model: Food, as: "Food", attributes: ["Price", "DiscountPrice"] },
        { model: Size, as: "Size", attributes: ["ExtraPrice"] },
        {
          model: GioHang_Topping,
          as: "GioHang_Toppings",
          include: [
            { model: Topping, as: "Topping", attributes: ["ToppingPrice"] },
          ],
        },
      ],
      transaction: t,
    });

    if (!cartItem) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy sản phẩm trong giỏ" });
    }
    if (cartItem.Id !== userId) {
      return res
        .status(403)
        .json({ success: false, message: "Không có quyền" });
    }

    const base =
      cartItem.Food.DiscountPrice && cartItem.Food.DiscountPrice > 0
        ? Number(cartItem.Food.DiscountPrice)
        : Number(cartItem.Food.Price);

    const sizeExtra = cartItem.Size ? Number(cartItem.Size.ExtraPrice || 0) : 0;
    const topSum = cartItem.GioHang_Toppings.reduce(
      (s, gt) => s + Number(gt.Topping.ToppingPrice || 0),
      0
    );

    const newTotal = (base + sizeExtra + topSum) * qty;

    await cartItem.update(
      { SoLuong: qty, TotalPrice: newTotal },
      { transaction: t }
    );
    await t.commit();

    const totalQty = await GioHang.sum("SoLuong", { where: { Id: userId } });
    const cartCount = totalQty ?? 0;

    res.json({
      success: true,
      message: "Cập nhật số lượng thành công!",
      newItemTotal: newTotal,
      cartCount,
    });
  } catch (err) {
    await t.rollback();
    console.error("UPDATE CART ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi cập nhật!",
      detail: err.message,
    });
  }
};

// =========================
// XÓA ITEM KHỎI GIỎ
// =========================
exports.deleteCart = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { gioHangId } = req.body;
    const userId = req.user.id;

    if (!gioHangId) {
      return res
        .status(400)
        .json({ success: false, message: "Thiếu gioHangId" });
    }

    const cartItem = await GioHang.findByPk(gioHangId, { transaction: t });
    if (!cartItem) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy sản phẩm" });
    }
    if (cartItem.Id !== userId) {
      return res
        .status(403)
        .json({ success: false, message: "Không có quyền" });
    }

    await GioHang_Topping.destroy({
      where: { GioHangID: gioHangId },
      transaction: t,
    });
    await cartItem.destroy({ transaction: t });
    await t.commit();

    const result = await GioHang.findOne({
      where: { Id: userId },
      attributes: [
        [sequelize.fn("SUM", sequelize.col("SoLuong")), "TotalQty"],
        [sequelize.fn("SUM", sequelize.col("TotalPrice")), "TotalPrice"],
      ],
    });

    const cartCount = result ? Number(result.getDataValue("TotalQty")) || 0 : 0;
    const totalPrice = result
      ? Number(result.getDataValue("TotalPrice")) || 0
      : 0;

    res.json({
      success: true,
      message: "Xóa sản phẩm thành công!",
      cartCount,
      totalPrice,
    });
  } catch (err) {
    await t.rollback();
    console.error("DELETE CART ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi xóa!",
      detail: err.message,
    });
  }
};

// Export middleware
module.exports.authenticateToken = authenticateToken;
