// backend/routes/user/cartUser.js
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { poolPromise, sql } = require("../../db");

// Middleware xác thực token (Bearer <token>)
function authenticate(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ message: "Missing token" });
  const parts = authHeader.split(" ");
  const token = parts.length === 2 ? parts[1] : null;
  if (!token) return res.status(401).json({ message: "Invalid token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error("Token verify failed:", err);
    return res.status(401).json({ message: "Unauthorized" });
  }
}

// helper: sắp xếp và so sánh 2 mảng số
function equalArrayNumbers(a = [], b = []) {
  const aa = a.map(Number).sort((x, y) => x - y);
  const bb = b.map(Number).sort((x, y) => x - y);
  if (aa.length !== bb.length) return false;
  for (let i = 0; i < aa.length; i++) if (aa[i] !== bb[i]) return false;
  return true;
}

// -------------------- Thêm sản phẩm vào giỏ --------------------
router.post("/add", authenticate, async (req, res) => {
  try {
    // hỗ trợ nhiều tên field (productId || foodId) và (quantity || soLuong)
    const foodId = parseInt(req.body.productId ?? req.body.foodId, 10);
    const soLuong = parseInt(req.body.quantity ?? req.body.soLuong, 10);
    let sizeId = req.body.sizeId ?? req.body.SizeId ?? null;
    const toppingIds = Array.isArray(req.body.toppingIds) ? req.body.toppingIds.map((x) => Number(x)) : [];

    if (!foodId || !soLuong || isNaN(soLuong) || soLuong <= 0) {
      return res.status(400).json({ success: false, message: "Thiếu hoặc sai thông tin sản phẩm / số lượng" });
    }

    if (sizeId !== null && sizeId !== undefined) {
      sizeId = sizeId === 0 ? null : parseInt(sizeId, 10);
    } else {
      sizeId = null;
    }

    const userId = req.user.id;
    const pool = await poolPromise;

    // 1) Lấy thông tin food
    const foodRes = await pool
      .request()
      .input("FoodId", sql.Int, foodId)
      .query("SELECT FoodId, Price, DiscountPrice, Stock FROM Food WHERE FoodId = @FoodId");
    if (foodRes.recordset.length === 0) {
      return res.status(404).json({ success: false, message: "Sản phẩm không tồn tại" });
    }
    const food = foodRes.recordset[0];

    // kiểm tồn kho nếu muốn
    if (food.Stock !== null && typeof food.Stock !== "undefined" && food.Stock < soLuong) {
      // không bắt buộc, chỉ cảnh báo
      return res.status(400).json({ success: false, message: "Số lượng vượt quá tồn kho" });
    }

    const basePrice = (food.DiscountPrice !== null && typeof food.DiscountPrice !== "undefined" && food.DiscountPrice !== 0)
      ? food.DiscountPrice
      : food.Price;

    // 2) Lấy giá size (nếu có)
    let sizePrice = 0;
    if (sizeId) {
      const sizeRes = await pool
        .request()
        .input("SizeId", sql.Int, sizeId)
        .query("SELECT SizeID, ExtraPrice FROM Size WHERE SizeID = @SizeId");
      if (sizeRes.recordset.length === 0) {
        return res.status(400).json({ success: false, message: "Size không hợp lệ" });
      }
      sizePrice = Number(sizeRes.recordset[0].ExtraPrice || 0);
    }

    // 3) Lấy tổng topping (nếu có) - chú ý dùng cột ToppingPrice
    let toppingTotal = 0;
    const safeToppingIds = toppingIds.filter((v) => Number.isInteger(Number(v)));
    if (safeToppingIds.length > 0) {
      const idsList = safeToppingIds.join(",");
      const topRes = await pool.request().query(
        `SELECT ToppingID, ToppingPrice FROM Topping WHERE ToppingID IN (${idsList})`
      );
      toppingTotal = topRes.recordset.reduce((s, r) => s + Number(r.ToppingPrice || 0), 0);
    }

    // 4) Tính tổng tiền item
    const itemTotalPrice = (Number(basePrice || 0) + Number(sizePrice || 0) + Number(toppingTotal || 0)) * Number(soLuong);

    // 5) Tìm các GioHang cùng user & food & size (size null vs null cần xử lý)
    const existsRes = await pool
      .request()
      .input("UserId", sql.Int, userId)
      .input("FoodId", sql.Int, foodId)
      .input("SizeId", sql.Int, sizeId ?? null)
      .query(
        `SELECT GioHangID, SoLuong, TotalPrice 
         FROM GioHang 
         WHERE Id = @UserId AND FoodId = @FoodId 
           AND ( (SizeID = @SizeId) OR (SizeID IS NULL AND @SizeId IS NULL) )`
      );

    // 6) Trong các bản ghi trên, so sánh topping (từng hàng trong GioHang_Topping)
    let matchedGioHangId = null;
    for (let row of existsRes.recordset) {
      const gtRes = await pool
        .request()
        .input("GioHangID", sql.Int, row.GioHangID)
        .query("SELECT ToppingID FROM GioHang_Topping WHERE GioHangID = @GioHangID");
      const existingIds = gtRes.recordset.map((r) => Number(r.ToppingID));
      if (equalArrayNumbers(existingIds, safeToppingIds)) {
        matchedGioHangId = row.GioHangID;
        break;
      }
    }

    if (matchedGioHangId) {
      // Cập nhật số lượng và tổng giá
      await pool
        .request()
        .input("SoLuongAdd", sql.Int, soLuong)
        .input("AddTotal", sql.Decimal(18, 3), itemTotalPrice)
        .input("GioHangID", sql.Int, matchedGioHangId)
        .query("UPDATE GioHang SET SoLuong = SoLuong + @SoLuongAdd, TotalPrice = TotalPrice + @AddTotal WHERE GioHangID = @GioHangID");
    } else {
      // Thêm mới vào GioHang
      const insertRes = await pool
        .request()
        .input("UserId", sql.Int, userId)
        .input("FoodId", sql.Int, foodId)
        .input("SoLuong", sql.Int, soLuong)
        .input("SizeID", sql.Int, sizeId ?? null)
        .input("TotalPrice", sql.Decimal(18, 3), itemTotalPrice)
        .query(`INSERT INTO GioHang (Id, FoodId, SoLuong, SizeID, TotalPrice)
                OUTPUT INSERTED.GioHangID
                VALUES (@UserId, @FoodId, @SoLuong, @SizeID, @TotalPrice)`);

      const newGioHangId = insertRes.recordset[0].GioHangID;

      // Thêm vào GioHang_Topping nếu có
      if (safeToppingIds.length > 0) {
        for (let tid of safeToppingIds) {
          await pool
            .request()
            .input("GioHangID", sql.Int, newGioHangId)
            .input("ToppingID", sql.Int, tid)
            .query("INSERT INTO GioHang_Topping (GioHangID, ToppingID) VALUES (@GioHangID, @ToppingID)");
        }
      }
    }

    // Cập nhật tổng số lượng trong session (nếu cần) — trả về cartCount
    const totalCountRes = await pool
      .request()
      .input("UserId", sql.Int, userId)
      .query("SELECT SUM(SoLuong) AS TotalQty FROM GioHang WHERE Id = @UserId");
    const cartCount = totalCountRes.recordset[0]?.TotalQty ?? 0;

    return res.json({ success: true, message: "Đã thêm vào giỏ hàng", cartCount });
  } catch (err) {
    console.error("Add to cart error:", err);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

// -------------------- Lấy giỏ hàng cho user --------------------
router.get("/", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const pool = await poolPromise;

    const q = `
      SELECT gh.GioHangID, gh.Id, gh.FoodId, gh.SoLuong, gh.SizeID, gh.TotalPrice,
             f.FoodName, f.Price, f.DiscountPrice, f.ImageURL,
             s.SizeName, s.ExtraPrice
      FROM GioHang gh
      JOIN Food f ON gh.FoodId = f.FoodId
      LEFT JOIN Size s ON gh.SizeID = s.SizeID
      WHERE gh.Id = @UserId
      ORDER BY gh.GioHangID DESC
    `;
    const cartRes = await pool.request().input("UserId", sql.Int, userId).query(q);
    const rows = cartRes.recordset || [];

    const cart = [];
    for (let r of rows) {
      const topRes = await pool
        .request()
        .input("GioHangID", sql.Int, r.GioHangID)
        .query(
          `SELECT t.ToppingID, t.ToppingName, t.ToppingPrice
           FROM GioHang_Topping gt
           JOIN Topping t ON gt.ToppingID = t.ToppingID
           WHERE gt.GioHangID = @GioHangID`
        );
      const toppings = topRes.recordset || [];
      cart.push({
        GioHangID: r.GioHangID,
        Id: r.Id,
        FoodId: r.FoodId,
        SoLuong: r.SoLuong,
        SizeID: r.SizeID,
        TotalPrice: Number(r.TotalPrice || 0),
        FoodName: r.FoodName,
        Price: Number(r.Price || 0),
        DiscountPrice: r.DiscountPrice !== null ? Number(r.DiscountPrice) : null,
        ImageURL: r.ImageURL,
        Size: r.SizeID ? { SizeID: r.SizeID, SizeName: r.SizeName, ExtraPrice: Number(r.ExtraPrice || 0) } : null,
        Toppings: toppings.map(t => ({ ToppingID: t.ToppingID, ToppingName: t.ToppingName, ToppingPrice: Number(t.ToppingPrice || 0) }))
      });
    }

    return res.json({ success: true, cart });
  } catch (err) {
    console.error("Get cart error:", err);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

// -------------------- Cập nhật số lượng (theo GioHangID) --------------------
router.post("/update", authenticate, async (req, res) => {
  try {
    const { gioHangId, quantity } = req.body;
    const userId = req.user.id;
    const qty = parseInt(quantity, 10);
    if (!gioHangId || isNaN(qty) || qty < 1) return res.status(400).json({ success: false, message: "Dữ liệu không hợp lệ" });

    const pool = await poolPromise;

    // Kiểm xem thuộc user không
    const ghRes = await pool.request().input("GioHangID", sql.Int, gioHangId).query("SELECT * FROM GioHang WHERE GioHangID = @GioHangID");
    if (!ghRes.recordset.length) return res.status(404).json({ success: false, message: "Không tìm thấy giỏ hàng" });
    if (ghRes.recordset[0].Id !== userId) return res.status(403).json({ success: false, message: "Không có quyền" });

    // Lấy thông tin unit price: food price/disc + size.extra + sum(topping)
    const foodRes = await pool
      .request()
      .input("FoodId", sql.Int, ghRes.recordset[0].FoodId)
      .query("SELECT Price, DiscountPrice FROM Food WHERE FoodId = @FoodId");
    const base = (foodRes.recordset[0].DiscountPrice && foodRes.recordset[0].DiscountPrice !== 0) ? Number(foodRes.recordset[0].DiscountPrice) : Number(foodRes.recordset[0].Price);

    let sizeExtra = 0;
    if (ghRes.recordset[0].SizeID) {
      const s = await pool.request().input("SizeID", sql.Int, ghRes.recordset[0].SizeID).query("SELECT ExtraPrice FROM Size WHERE SizeID = @SizeID");
      sizeExtra = s.recordset.length ? Number(s.recordset[0].ExtraPrice || 0) : 0;
    }

    const topSumRes = await pool
      .request()
      .input("GioHangID", sql.Int, gioHangId)
      .query(`SELECT SUM(t.ToppingPrice) AS SumTop
              FROM GioHang_Topping gt
              JOIN Topping t ON gt.ToppingID = t.ToppingID
              WHERE gt.GioHangID = @GioHangID`);
    const topSum = Number(topSumRes.recordset[0]?.SumTop || 0);

    const newTotal = (base + sizeExtra + topSum) * qty;

    await pool
      .request()
      .input("SoLuong", sql.Int, qty)
      .input("TotalPrice", sql.Decimal(18, 3), newTotal)
      .input("GioHangID", sql.Int, gioHangId)
      .query("UPDATE GioHang SET SoLuong = @SoLuong, TotalPrice = @TotalPrice WHERE GioHangID = @GioHangID");

    // tổng count
    const cntRes = await pool.request().input("UserId", sql.Int, userId).query("SELECT SUM(SoLuong) AS TotalQty FROM GioHang WHERE Id = @UserId");
    const cartCount = cntRes.recordset[0]?.TotalQty ?? 0;

    return res.json({ success: true, newItemTotal: newTotal, cartCount });
  } catch (err) {
    console.error("Update cart error:", err);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

// -------------------- Xóa item khỏi giỏ --------------------
router.post("/delete", authenticate, async (req, res) => {
  try {
    const { gioHangId } = req.body;
    const userId = req.user.id;
    if (!gioHangId) return res.status(400).json({ success: false, message: "Thiếu gioHangId" });

    const pool = await poolPromise;
    const ghRes = await pool.request().input("GioHangID", sql.Int, gioHangId).query("SELECT * FROM GioHang WHERE GioHangID = @GioHangID");
    if (!ghRes.recordset.length) return res.status(404).json({ success: false, message: "Không tìm thấy item" });
    if (ghRes.recordset[0].Id !== userId) return res.status(403).json({ success: false, message: "Không có quyền" });

    // Xóa topping liên quan
    await pool.request().input("GioHangID", sql.Int, gioHangId).query("DELETE FROM GioHang_Topping WHERE GioHangID = @GioHangID");
    // Xóa item
    await pool.request().input("GioHangID", sql.Int, gioHangId).query("DELETE FROM GioHang WHERE GioHangID = @GioHangID");

    const cntRes = await pool.request().input("UserId", sql.Int, userId).query("SELECT SUM(SoLuong) AS TotalQty, SUM(TotalPrice) AS TotalPrice FROM GioHang WHERE Id = @UserId");
    const cartCount = cntRes.recordset[0]?.TotalQty ?? 0;
    const totalPrice = cntRes.recordset[0]?.TotalPrice ?? 0;

    return res.json({ success: true, cartCount, totalPrice });
  } catch (err) {
    console.error("Delete cart error:", err);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

module.exports = router;
