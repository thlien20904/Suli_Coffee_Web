const express = require("express");
const router = express.Router();
const { poolPromise, sql } = require("../../db");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const crypto = require("crypto");
dotenv.config();

// Middleware xác thực JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ success: false, message: "Bạn chưa đăng nhập!" });
  jwt.verify(token, process.env.JWT_SECRET || "dev_secret_fallback", (err, user) => {
    if (err) return res.status(403).json({ success: false, message: "Token không hợp lệ!" });
    req.user = user;  // req.user.id = userId
    next();
  });
}

// Hàm tạo URL VNPay
async function createVnpayUrl(orderId, amount) {
  const vnp_Url = process.env.VNP_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
  const vnp_TmnCode = process.env.VNP_TMN_CODE || "your_vnp_tmn_code";
  const vnp_HashSecret = process.env.VNP_HASH_SECRET || "your_vnp_hash_secret";
  const vnp_ReturnUrl = process.env.VNP_RETURN_URL || "http://localhost:5000/api/orders/vnpay-return";

  if (!vnp_TmnCode || !vnp_HashSecret) {
    console.error("VNPay config missing");
    return null;
  }

  const params = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode,
    vnp_Amount: (amount * 100).toString(),  // *100 cho VND
    vnp_CreateDate: new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14),
    vnp_CurrCode: "VND",
    vnp_IpAddr: "127.0.0.1",  
    vnp_Locale: "vn",
    vnp_OrderInfo: `Thanh toan don hang: ${orderId}`,
    vnp_OrderType: "250000",
    vnp_ReturnUrl,
    vnp_TxnRef: orderId.toString()
  };

  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  const hmac = crypto.createHmac("sha512", vnp_HashSecret);
  const vnp_SecureHash = hmac.update(sortedParams).digest("hex");
  return `${vnp_Url}?${sortedParams}&vnp_SecureHash=${vnp_SecureHash}`;
}

// ------------------------------------------------------------------
// API ENDPOINTS
// ------------------------------------------------------------------

// [HttpPost] PrepareCheckout (Giữ nguyên)
router.post("/prepare", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id;
      const { selectedItems } = req.body;  // List<int> selectedItems = GioHangID array

      if (!selectedItems || !Array.isArray(selectedItems) || selectedItems.length === 0) {
        return res.json({ success: false, message: "Không có sản phẩm nào được chọn!" });
      }

      const pool = await poolPromise;
      const request = pool.request();
      request.input("UserId", sql.Int, userId);
      const selectedItemsParams = selectedItems.map((_, index) => `@Item${index}`);
      selectedItems.forEach((item, index) => {
        request.input(`Item${index}`, sql.Int, item);
      });
      // Lưu ý: Cần thêm thông tin topping (nếu có)
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
        WHERE gh.Id = @UserId AND gh.GioHangID IN (${selectedItemsParams.join(",")})
      `);

      if (result.recordset.length === 0) {
        return res.json({ success: false, message: "Không tìm thấy sản phẩm được chọn trong giỏ hàng!" });
      }

      const items = result.recordset.map(item => ({
        ...item,
        Toppings: item.ToppingsJSON ? JSON.parse(item.ToppingsJSON) : [],
        Size: item.SizeID ? { SizeID: item.SizeID, SizeName: item.SizeName, ExtraPrice: item.ExtraPrice } : null,
        SoLuong: item.SoLuong,
        FoodName: item.FoodName,
        // Loại bỏ các trường JSON/tên cũ sau khi parse
        ToppingsJSON: undefined, SizeID: undefined, SizeName: undefined, ExtraPrice: undefined, Quantity: undefined
      }));
      
      const subtotal = items.reduce((sum, i) => sum + i.TotalPrice, 0);
      const shipping = 20000;
      const total = subtotal + shipping;
      const paymentMethods = await pool.request().query("SELECT Id AS PaymentMethodId, TenPhuongThuc AS Name FROM PhuongThucThanhToan");

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
      console.error("Prepare error:", err.message, err.stack);
      res.status(500).json({ success: false, message: "Có lỗi xảy ra khi chuẩn bị thanh toán!" });
    }
});

// [HttpPost] ThanhToan - Xử lý place order (ĐÃ SỬA VÀ HOÀN THIỆN)
router.post("/place-order", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    // ✅ Lấy cả selectedItems (Giỏ hàng) và orderItems (Mua ngay)
    const { newAddress, paymentMethodId, selectedItems, orderItems } = req.body;
    console.log("PlaceOrder - Body:", req.body);

    let itemsToOrder = [];
    let isFromCart = false;
    
    const pool = await poolPromise;

    // --- 1. XÁC ĐỊNH LUỒNG VÀ LẤY DỮ LIỆU SẢN PHẨM ---
    if (selectedItems && Array.isArray(selectedItems) && selectedItems.length > 0) {
      isFromCart = true;
      // Luồng GIỎ HÀNG: Lấy từ DB
      const request = pool.request();
      request.input("UserId", sql.Int, userId);
      const selectedItemsParams = selectedItems.map((_, index) => `@Item${index}`);
      selectedItems.forEach((item, index) => {
        request.input(`Item${index}`, sql.Int, item);
      });
      const gioHangResult = await request.query(`
        SELECT gh.GioHangID, gh.SoLuong AS Quantity, gh.TotalPrice,
              f.FoodId, f.FoodName, sz.SizeID, 
              (SELECT gt.ToppingID FROM GioHang_Topping gt WHERE gt.GioHangID = gh.GioHangID FOR JSON PATH) AS ToppingsJSON
        FROM GioHang gh
        JOIN Food f ON gh.FoodId = f.FoodId
        LEFT JOIN Size sz ON gh.SizeID = sz.SizeID
        WHERE gh.Id = @UserId AND gh.GioHangID IN (${selectedItemsParams.join(",")})
      `);
      
      itemsToOrder = gioHangResult.recordset.map(item => ({
          ...item,
          Quantity: item.Quantity,
          ToppingIDs: item.ToppingsJSON ? JSON.parse(item.ToppingsJSON).map(t => t.ToppingID) : []
      }));
    } 
    else if (orderItems && Array.isArray(orderItems) && orderItems.length > 0) {
      // Luồng MUA NGAY: Sử dụng dữ liệu trực tiếp từ Frontend (Checkout.js)
      itemsToOrder = orderItems.map(item => ({
        FoodId: item.FoodId,
        SizeID: item.SizeID || null,
        Quantity: item.Quantity,
        TotalPrice: item.TotalPrice,
        ToppingIDs: item.ToppingIDs || [] // Mảng ToppingIDs
      }));
    } else {
      // Xử lý lỗi nếu không có sản phẩm nào
      return res.json({ success: false, message: "Không có sản phẩm nào được chọn!" });
    }

    if (itemsToOrder.length === 0) {
      return res.json({ success: false, message: "Không tìm thấy sản phẩm hợp lệ để đặt hàng!" });
    }
    
    // --- 2. VALIDATE VÀ CẬP NHẬT THÔNG TIN NGƯỜI DÙNG ---
    const userResult = await pool.request().input("Id", sql.Int, userId).query("SELECT Id, Address FROM Users WHERE Id = @Id");
    if (userResult.recordset.length === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy người dùng!" });
    }
    let user = userResult.recordset[0];

    if (!paymentMethodId) {
      return res.json({ success: false, message: "Vui lòng chọn phương thức thanh toán!" });
    }

    let finalAddress = newAddress && newAddress.trim() ? newAddress.trim() : user.Address;
    if (!finalAddress) {
      return res.json({ success: false, message: "Địa chỉ giao hàng không được để trống!" });
    }
    await pool.request()
      .input("Id", sql.Int, userId)
      .input("Address", sql.NVarChar(255), finalAddress)
      .query("UPDATE Users SET Address = @Address WHERE Id = @Id");

    // --- 3. TÍNH TỔNG VÀ TẠO ĐƠN HÀNG (Order) ---
    const subtotal = itemsToOrder.reduce((sum, item) => sum + item.TotalPrice, 0);
    const shipping = 20000;
    const totalAmount = subtotal + shipping;

    const statusResult = await pool.request().query("SELECT StatusId FROM OrderStatus WHERE StatusName = N'Đặt hàng thành công'");
    if (statusResult.recordset.length === 0) {
      return res.status(500).json({ success: false, message: "Không tìm thấy trạng thái 'Đặt hàng thành công'!" });
    }
    const statusId = statusResult.recordset[0].StatusId;

    const orderResult = await pool.request()
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

    // --- 4. TẠO CHI TIẾT ĐƠN HÀNG (OrderDetails) ---
    for (const item of itemsToOrder) {
      const unitPrice = item.TotalPrice / item.Quantity;

      // 4a. Insert OrderDetails cơ bản
      const orderDetailResult = await pool.request()
        .input("OrderId", sql.Int, orderId)
        .input("FoodId", sql.Int, item.FoodId)
        .input("SizeId", sql.Int, item.SizeID || null)
        .input("Quantity", sql.Int, item.Quantity)
        .input("Price", sql.Decimal(18, 3), unitPrice)
        .query(`
          INSERT INTO OrderDetails (OrderId, FoodId, SizeId, ToppingId, Quantity, Price)
          OUTPUT INSERTED.OrderDetailId
          VALUES (@OrderId, @FoodId, @SizeId, NULL, @Quantity, @Price)
        `);
      const orderDetailId = orderDetailResult.recordset[0].OrderDetailId;
        // Lấy topping từ bảng GioHang_Topping
const toppingRows = await pool.request()
  .input("GioHangID", sql.Int, item.GioHangID)
  .query("SELECT ToppingID FROM GioHang_Topping WHERE GioHangID = @GioHangID");

for (const row of toppingRows.recordset) {
  await pool.request()
    .input("OrderDetailId", sql.Int, orderDetailId)
    .input("ToppingId", sql.Int, row.ToppingID)
    .query(`
      INSERT INTO OrderDetails_Topping (OrderDetailId, ToppingId)
      VALUES (@OrderDetailId, @ToppingId)
    `);
}

      // 4b. Insert OrderDetails_Topping (Nếu có)
      if (item.ToppingIDs && item.ToppingIDs.length > 0) {
        for (const toppingId of item.ToppingIDs) {
          await pool.request()
            .input("OrderDetailId", sql.Int, orderDetailId)
            .input("ToppingId", sql.Int, toppingId)
            .query(`
              INSERT INTO OrderDetails_Topping (OrderDetailId, ToppingId)
              VALUES (@OrderDetailId, @ToppingId)
            `);
        }
      }
    }

    // --- 5. XỬ LÝ THANH TOÁN VÀ DỌN DẸP GIỎ HÀNG ---
    if (paymentMethodId === 1) { // VNPay
      const paymentUrl = await createVnpayUrl(orderId, totalAmount);
      if (!paymentUrl) {
        return res.status(500).json({ success: false, message: "Lỗi khi tạo URL thanh toán VNPay!" });
      }
      // Chờ callback VnpayReturn để xóa GioHang
      return res.json({ success: true, Code: paymentMethodId, Url: paymentUrl });
    }

    // Nếu là COD (paymentMethodId != 1) VÀ đặt từ GIỎ HÀNG, thì xóa giỏ hàng
    if (isFromCart) {
      // ✅ XÓA SẢN PHẨM ĐÃ THANH TOÁN KHỎI GIỎ HÀNG
      const selectedIdsParams = selectedItems.map((_, index) => `@GioHangID${index}`).join(",");
      
      // 1. Xóa Topping
      const deleteToppingRequest = pool.request();
      selectedItems.forEach((id, index) => deleteToppingRequest.input(`GioHangID${index}`, sql.Int, id));
      await deleteToppingRequest.query(`
        DELETE FROM GioHang_Topping 
        WHERE GioHangID IN (${selectedIdsParams})
      `);

      // 2. Xóa Cart Item
      const deleteCartRequest = pool.request();
      selectedItems.forEach((id, index) => deleteCartRequest.input(`GioHangID${index}`, sql.Int, id));
      deleteCartRequest.input("UserId", sql.Int, userId);
      await deleteCartRequest.query(`
        DELETE FROM GioHang 
        WHERE Id = @UserId AND GioHangID IN (${selectedIdsParams})
      `);
    }

    // ✅ Trả kết quả cho COD/Mua ngay thành công
    res.json({ success: true, message: "Đặt hàng thành công!", orderId, Code: paymentMethodId });
  } catch (err) {
    console.error("Place order error:", err.message, err.stack);
    res.status(500).json({ success: false, message: "Có lỗi xảy ra trong quá trình xử lý!" });
  }
});


// ActionResult ThanhCong (Giữ nguyên)
router.get("/successful", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const pool = await poolPromise;
    const orderResult = await pool.request().input("UserId", sql.Int, userId).query(`
      SELECT TOP 1 OrderId, OrderDate
      FROM Orders
      WHERE UserId = @UserId
      ORDER BY OrderDate DESC
    `);
    let message = "Bạn đã đặt hàng thành công lúc " + new Date().toLocaleString("vi-VN", {
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      day: "2-digit", month: "2-digit", year: "numeric"
    });
    if (orderResult.recordset.length > 0) {
      const orderDate = new Date(orderResult.recordset[0].OrderDate);
      message = "Bạn đã đặt hàng thành công lúc " + orderDate.toLocaleString("vi-VN", {
        hour: "2-digit", minute: "2-digit", second: "2-digit",
        day: "2-digit", month: "2-digit", year: "numeric"
      });
    }
    res.json({ success: true, message });
  } catch (err) {
    console.error("Success error:", err.message, err.stack);
    res.status(500).json({ success: false, message: "Lỗi khi truy cập trang thành công!" });
  }
});

// [HttpPost] AddDeliveryAddress (Cập nhật Address trong Users, giữ nguyên)
router.post("/add-address", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { newAddress } = req.body;
    if (!newAddress || newAddress.trim() === "") {
      return res.json({ success: false, message: "Địa chỉ không được để trống!" });
    }
    const pool = await poolPromise;
    await pool.request()
      .input("Id", sql.Int, userId)
      .input("Address", sql.NVarChar(255), newAddress.trim())
      .query("UPDATE Users SET Address = @Address WHERE Id = @Id");
    res.json({ success: true, message: "Cập nhật địa chỉ thành công!" });
  } catch (err) {
    console.error("Add address error:", err.message, err.stack);
    res.status(500).json({ success: false, message: "Có lỗi xảy ra khi thêm địa chỉ!" });
  }
});

// VnpayReturn - Callback VNPay (Giữ nguyên, nhưng sửa lại việc xóa giỏ hàng)
router.get("/vnpay-return", async (req, res) => {
  try {
    const vnpayData = req.query;
    console.log("VNPay callback data:", vnpayData);  // Debug
    const vnp_HashSecret = process.env.VNP_HASH_SECRET || "your_vnp_hash_secret";

    // Validate signature
    const signData = Object.keys(vnpayData)
      .filter((key) => key.startsWith("vnp_") && key !== "vnp_SecureHash")
      .sort()
      .map((key) => `${key}=${vnpayData[key]}`)
      .join("&");
    const hmac = crypto.createHmac("sha512", vnp_HashSecret);
    const signed = hmac.update(signData).digest("hex");
    const isValid = signed === vnpayData.vnp_SecureHash;
    if (!isValid) {
      return res.status(400).json({ success: false, message: "Có lỗi xảy ra trong quá trình xác thực chữ ký." });
    }

    const orderId = parseInt(vnpayData.vnp_TxnRef);
    const vnp_ResponseCode = vnpayData.vnp_ResponseCode;
    const vnp_TransactionStatus = vnpayData.vnp_TransactionStatus;
    const vnp_Amount = parseInt(vnpayData.vnp_Amount) / 100;

    if (vnp_ResponseCode === "00" && vnp_TransactionStatus === "00") {
      const pool = await poolPromise;
      const transaction = new sql.Transaction(pool);
      await transaction.begin();
      try {
        const orderResult = await transaction.request().input("OrderId", sql.Int, orderId).query("SELECT UserId, PaymentMethodId FROM Orders WHERE OrderId = @OrderId");
        if (orderResult.recordset.length === 0) {
          await transaction.rollback();
          return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng!" });
        }
        const userId = orderResult.recordset[0].UserId;

        const statusResult = await transaction.request().query("SELECT StatusId FROM OrderStatus WHERE StatusName = N'Đã thanh toán'");
        if (statusResult.recordset.length === 0) {
          await transaction.rollback();
          return res.status(500).json({ success: false, message: "Không tìm thấy trạng thái 'Đã thanh toán'!" });
        }

        await transaction.request()
          .input("OrderId", sql.Int, orderId)
          .input("StatusId", sql.Int, statusResult.recordset[0].StatusId)
          .query("UPDATE Orders SET StatusId = @StatusId WHERE OrderId = @OrderId");

        // ✅ Xóa tất cả GioHang của User. (Hàm này có vấn đề nếu user có nhiều item chưa đặt, 
        // nhưng giữ theo logic cũ của bạn vì không có Session["SelectedCartItems"] để lọc)
        await transaction.request().input("Id", sql.Int, userId).query("DELETE FROM GioHang_Topping WHERE GioHangID IN (SELECT GioHangID FROM GioHang WHERE Id = @Id)");
        await transaction.request().input("Id", sql.Int, userId).query("DELETE FROM GioHang WHERE Id = @Id");

        await transaction.commit();
        res.json({
          success: true,
          message: "Giao dịch được thực hiện thành công. Cảm ơn quý khách đã sử dụng dịch vụ",
          orderId,
          ThanhToanThanhCong: `Số tiền thanh toán (VND): ${vnp_Amount.toLocaleString("vi-VN")}`
        });
      } catch (err) {
        await transaction.rollback();
        throw err;
      }
    } else {
      res.status(400).json({ success: false, message: `Có lỗi xảy ra trong quá trình xử lý. Mã lỗi: ${vnp_ResponseCode}` });
    }
  } catch (err) {
    console.error("VNPay return error:", err.message, err.stack);
    res.status(500).json({ success: false, message: "Có lỗi xảy ra trong quá trình xử lý!" });
  }
});

module.exports = router;