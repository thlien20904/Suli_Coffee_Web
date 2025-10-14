const express = require("express");
const router = express.Router();
const { poolPromise, sql } = require("../../db");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const { VNPay, ignoreLogger, ProductCode, VnpLocale, dateFormat } = require("vnpay");
dotenv.config();

/* ---------------- MIDDLEWARE XÁC THỰC ---------------- */
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token)
    return res.status(401).json({ success: false, message: "Bạn chưa đăng nhập!" });

  jwt.verify(token, process.env.JWT_SECRET || "dev_secret_fallback", (err, user) => {
    if (err)
      return res.status(403).json({ success: false, message: "Token không hợp lệ!" });
    req.user = user;
    next();
  });
}

/* ---------------- CẤU HÌNH VNPay ---------------- */
const vnpay = new VNPay({
  tmnCode: process.env.VNPAY_TMN_CODE || "4Z1QBO45",
  secureSecret:
    process.env.VNPAY_SECURE_SECRET ||
    "XQBSS9ZDQJCIKDZZ108ABV5RP6B32FOH",
  vnpayHost: "https://sandbox.vnpayment.vn",
  testMode: true,
  hashAlgorithm: "SHA512",
  loggerFn: ignoreLogger,
});

/* ---------------- API: CHUẨN BỊ DỮ LIỆU THANH TOÁN ---------------- */
router.post("/prepare", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { selectedItems } = req.body;

    if (!selectedItems || selectedItems.length === 0)
      return res.json({ success: false, message: "Không có sản phẩm nào được chọn!" });

    const pool = await poolPromise;
    const request = pool.request();
    request.input("UserId", sql.Int, userId);
    const params = selectedItems.map((_, i) => `@Item${i}`).join(",");
    selectedItems.forEach((id, i) => request.input(`Item${i}`, sql.Int, id));

    const result = await request.query(`
      SELECT gh.GioHangID, gh.SoLuong, gh.TotalPrice,
             f.FoodId, f.FoodName, f.Price, f.DiscountPrice, f.ImageURL,
             sz.SizeID, sz.SizeName, sz.ExtraPrice,
             (SELECT gt.ToppingID, t.ToppingName, t.ToppingPrice
              FROM GioHang_Topping gt JOIN Topping t ON gt.ToppingID = t.ToppingID
              WHERE gt.GioHangID = gh.GioHangID FOR JSON PATH) AS ToppingsJSON
      FROM GioHang gh
      JOIN Food f ON gh.FoodId = f.FoodId
      LEFT JOIN Size sz ON gh.SizeID = sz.SizeID
      WHERE gh.Id = @UserId AND gh.GioHangID IN (${params})
    `);

    if (result.recordset.length === 0)
      return res.json({ success: false, message: "Không tìm thấy sản phẩm trong giỏ!" });

    const items = result.recordset.map((item) => ({
      ...item,
      Toppings: item.ToppingsJSON ? JSON.parse(item.ToppingsJSON) : [],
      ToppingsJSON: undefined,
    }));

    const subtotal = items.reduce((s, i) => s + i.TotalPrice, 0);
    const shipping = 20000;
    const total = subtotal + shipping;

    const paymentMethods = await pool
      .request()
      .query("SELECT Id AS PaymentMethodId, TenPhuongThuc AS Name FROM PhuongThucThanhToan");

    res.json({
      success: true,
      message: "Đã chuẩn bị dữ liệu thanh toán!",
      items,
      subtotal,
      shipping,
      total,
      paymentMethods: paymentMethods.recordset,
    });
  } catch (err) {
    console.error("Prepare error:", err.message);
    res.status(500).json({ success: false, message: "Lỗi khi chuẩn bị thanh toán!" });
  }
});

/* ---------------- API: ĐẶT HÀNG ---------------- */
router.post("/place-order", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { newAddress, paymentMethodId, selectedItems, orderItems } = req.body;
    const pool = await poolPromise;
    let itemsToOrder = [];

    // Lấy sản phẩm cần đặt
    if (selectedItems && selectedItems.length > 0) {
      const request = pool.request();
      request.input("UserId", sql.Int, userId);
      const params = selectedItems.map((_, i) => `@Item${i}`).join(",");
      selectedItems.forEach((id, i) => request.input(`Item${i}`, sql.Int, id));
      const result = await request.query(`
        SELECT gh.GioHangID, gh.SoLuong AS Quantity, gh.TotalPrice,
               f.FoodId, sz.SizeID,
               (SELECT gt.ToppingID FROM GioHang_Topping gt WHERE gt.GioHangID = gh.GioHangID FOR JSON PATH) AS ToppingsJSON
        FROM GioHang gh
        JOIN Food f ON gh.FoodId = f.FoodId
        LEFT JOIN Size sz ON gh.SizeID = sz.SizeID
        WHERE gh.Id = @UserId AND gh.GioHangID IN (${params})
      `);
      itemsToOrder = result.recordset.map((i) => ({
        FoodId: i.FoodId,
        SizeID: i.SizeID,
        Quantity: i.Quantity,
        TotalPrice: i.TotalPrice,
        GioHangID: i.GioHangID,
        ToppingIDs: i.ToppingsJSON
          ? JSON.parse(i.ToppingsJSON).map((t) => t.ToppingID)
          : [],
      }));
    } else if (orderItems && orderItems.length > 0) {
      itemsToOrder = orderItems;
    } else {
      return res.json({ success: false, message: "Không có sản phẩm nào để đặt!" });
    }

    // Lấy địa chỉ giao hàng
    const userResult = await pool
      .request()
      .input("Id", sql.Int, userId)
      .query("SELECT Address FROM Users WHERE Id = @Id");
    const user = userResult.recordset[0];
    const finalAddress = newAddress?.trim() || user?.Address;
    if (!finalAddress)
      return res.json({ success: false, message: "Địa chỉ giao hàng không được để trống!" });

    await pool
      .request()
      .input("Id", sql.Int, userId)
      .input("Address", sql.NVarChar(255), finalAddress)
      .query("UPDATE Users SET Address = @Address WHERE Id = @Id");

    // Tính tổng tiền
    const subtotal = itemsToOrder.reduce((s, i) => s + i.TotalPrice, 0);
    const shipping = 20000;
    const totalAmount = subtotal + shipping;

    const statusResult = await pool
      .request()
      .query("SELECT StatusId FROM OrderStatus WHERE StatusName = N'Đặt hàng thành công'");
    const statusId = statusResult.recordset[0].StatusId;

    // Tạo đơn hàng
    const orderResult = await pool
      .request()
      .input("UserId", sql.Int, userId)
      .input("TotalAmount", sql.Decimal(18, 3), totalAmount)
      .input("PaymentMethodId", sql.Int, paymentMethodId)
      .input("StatusId", sql.Int, statusId)
      .query(`
        INSERT INTO Orders (UserId, OrderDate, TotalAmount, PaymentMethodId, StatusId)
        OUTPUT INSERTED.OrderId
        VALUES (@UserId, GETDATE(), @TotalAmount, @PaymentMethodId, @StatusId)
      `);
    const orderId = orderResult.recordset[0].OrderId;

    // Thêm chi tiết đơn hàng
    for (const item of itemsToOrder) {
      const unitPrice = item.TotalPrice / item.Quantity;
      const detailResult = await pool
        .request()
        .input("OrderId", sql.Int, orderId)
        .input("FoodId", sql.Int, item.FoodId)
        .input("SizeId", sql.Int, item.SizeID)
        .input("Quantity", sql.Int, item.Quantity)
        .input("Price", sql.Decimal(18, 3), unitPrice)
        .query(`
          INSERT INTO OrderDetails (OrderId, FoodId, SizeId, Quantity, Price)
          OUTPUT INSERTED.OrderDetailId
          VALUES (@OrderId, @FoodId, @SizeId, @Quantity, @Price)
        `);

      const orderDetailId = detailResult.recordset[0].OrderDetailId;
      for (const toppingId of item.ToppingIDs || []) {
        await pool
          .request()
          .input("OrderDetailId", sql.Int, orderDetailId)
          .input("ToppingId", sql.Int, toppingId)
          .query(`
            INSERT INTO OrderDetails_Topping (OrderDetailId, ToppingId)
            VALUES (@OrderDetailId, @ToppingId)
          `);
      }
    }

    // Nếu thanh toán COD và đơn hàng từ giỏ hàng, xóa sản phẩm trong giỏ
    if (paymentMethodId === 2 && selectedItems && selectedItems.length > 0) {
      await pool
        .request()
        .input("OrderId", sql.Int, orderId)
        .query(`
          DELETE FROM GioHang
          WHERE GioHangID IN (
            SELECT DISTINCT gh.GioHangID
            FROM GioHang gh
            JOIN OrderDetails od ON gh.FoodId = od.FoodId
            WHERE od.OrderId = @OrderId
          )
        `);
    }

    // Nếu thanh toán VNPay → tạo link thanh toán
    if (paymentMethodId === 1) {
      const ipAddr =
        req.headers["x-forwarded-for"] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection?.socket?.remoteAddress ||
        "127.0.0.1";

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const paymentUrl = await vnpay.buildPaymentUrl({
        vnp_Amount: totalAmount , 
        vnp_IpAddr: ipAddr,
        vnp_TxnRef: orderId,
        vnp_OrderInfo: `Thanh toán đơn hàng ${orderId}`,
        vnp_OrderType: ProductCode.Other,
        vnp_ReturnUrl:
          process.env.VNPAY_RETURN_URL ||
          "http://localhost:3000/vnpay-return",
        vnp_Locale: VnpLocale.VN,
        vnp_CreateDate: dateFormat(new Date()),
        vnp_ExpireDate: dateFormat(tomorrow),
      });

      return res.json({ success: true, Code: paymentMethodId, Url: paymentUrl });
    }

    res.json({ success: true, message: "Đặt hàng thành công!", orderId });
  } catch (err) {
    console.error("Place order error:", err.message);
    res.status(500).json({ success: false, message: "Có lỗi xảy ra khi đặt hàng!" });
  }
});

/* ---------------- API: VNPay CALLBACK ---------------- */
router.get("/vnpay-return", async (req, res) => {
  try {
    const query = req.query;
    const verify = vnpay.verifyReturnUrl(query);

    if (!verify.isSuccess)
      return res.status(400).json({ success: false, message: "Xác thực giao dịch VNPay thất bại!" });

    const { vnp_TxnRef, vnp_TransactionStatus, vnp_Amount } = query;
    const pool = await poolPromise;

    if (vnp_TransactionStatus === "00") {
      // Lấy StatusId cho trạng thái "Giao hàng thành công"
      const statusResult = await pool
        .request()
        .query("SELECT StatusId FROM OrderStatus WHERE StatusName = N'Giao hàng thành công'");
      const statusId = statusResult.recordset[0]?.StatusId;

      if (!statusId) {
        return res.status(500).json({ success: false, message: "Không tìm thấy trạng thái 'Giao hàng thành công'!" });
      }

      // Cập nhật trạng thái đơn hàng
      await pool
        .request()
        .input("OrderId", sql.Int, vnp_TxnRef)
        .input("StatusId", sql.Int, statusId)
        .query("UPDATE Orders SET StatusId = @StatusId WHERE OrderId = @OrderId");

      // Xóa sản phẩm trong giỏ sau khi thanh toán thành công
      await pool
        .request()
        .input("OrderId", sql.Int, vnp_TxnRef)
        .query(`
          DELETE FROM GioHang
          WHERE GioHangID IN (
            SELECT DISTINCT gh.GioHangID
            FROM GioHang gh
            JOIN OrderDetails od ON gh.FoodId = od.FoodId
            WHERE od.OrderId = @OrderId
          )
        `);

      return res.json({
        success: true,
        message: "Thanh toán thành công!",
        ThanhToanThanhCong: vnp_Amount ? (parseInt(vnp_Amount) / 100).toFixed(2) : null, // Chuyển từ cent sang VND
        orderId: vnp_TxnRef,
      });
    } else {
      return res.json({
        success: false,
        message: "Thanh toán thất bại!",
        orderId: vnp_TxnRef,
      });
    }
  } catch (err) {
    console.error("VNPAY RETURN ERROR:", err.message, err.stack);
    return res.status(500).json({ success: false, message: "Lỗi xử lý giao dịch VNPay!" });
  }
});

module.exports = router;