const sequelize = require("../../config/sequelize");
const initModels = require("../../models/init-models");
const models = initModels(sequelize);
const {
  GioHang,
  GioHang_Topping,
  Users,
  Food,
  Size,
  Topping,
  Orders,
  OrderDetails,
  OrderDetails_Topping,
  PhuongThucThanhToan,
  OrderStatus,
} = models;
const { Op } = require("sequelize");
const jwt = require("jsonwebtoken");
const { VNPay, ProductCode, VnpLocale, dateFormat } = require("vnpay");

// Cấu hình VNPay
const vnpay = new VNPay({
  tmnCode: process.env.VNPAY_TMN_CODE || "4Z1QBO45",
  secureSecret:
    process.env.VNPAY_SECURE_SECRET || "XQBSS9ZDQJCIKDZZ108ABV5RP6B32FOH",
  vnpayHost: "https://sandbox.vnpayment.vn",
  testMode: true,
  hashAlgorithm: "SHA512",
});

// Middleware xác thực JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1];
  if (!token)
    return res
      .status(401)
      .json({ success: false, message: "Bạn chưa đăng nhập!" });

  jwt.verify(
    token,
    process.env.JWT_SECRET || "dev_secret_fallback",
    (err, user) => {
      if (err)
        return res
          .status(403)
          .json({ success: false, message: "Token không hợp lệ!" });
      req.user = user;
      next();
    }
  );
};

// Hàm định dạng item
const formatItem = (item) => ({
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
// 📌 CHUẨN BỊ DỮ LIỆU THANH TOÁN
// =========================
exports.prepareOrder = async (req, res) => {
  try {
    const { selectedItems } = req.body;
    if (!selectedItems?.length) {
      return res.json({
        success: false,
        message: "Không có sản phẩm nào được chọn!",
      });
    }

    const items = await GioHang.findAll({
      where: { Id: req.user.id, GioHangID: { [Op.in]: selectedItems } },
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
    });

    if (!items.length) {
      return res.json({
        success: false,
        message: "Không tìm thấy sản phẩm trong giỏ!",
      });
    }

    const formattedItems = items.map(formatItem);
    const subtotal = formattedItems.reduce(
      (sum, item) => sum + item.TotalPrice,
      0
    );
    const shipping = 20000;
    const total = subtotal + shipping;

    const paymentMethods = await PhuongThucThanhToan.findAll({
      attributes: [
        ["Id", "PaymentMethodId"],
        ["TenPhuongThuc", "Name"],
      ],
    });

    res.json({
      success: true,
      message: "Đã chuẩn bị dữ liệu thanh toán!",
      data: {
        items: formattedItems,
        subtotal,
        shipping,
        total,
        paymentMethods,
      },
    });
  } catch (err) {
    console.error("PREPARE ORDER ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Lỗi khi chuẩn bị thanh toán!",
      detail: err.message,
    });
  }
};

// =========================
// 📌 ĐẶT HÀNG
// =========================
exports.placeOrder = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { newAddress, paymentMethodId, selectedItems, orderItems } = req.body;
    let itemsToOrder = [];

    // Lấy sản phẩm cần đặt
    if (selectedItems?.length) {
      const cartItems = await GioHang.findAll({
        where: { Id: req.user.id, GioHangID: { [Op.in]: selectedItems } },
        attributes: ["GioHangID", "SoLuong", "TotalPrice", "FoodId", "SizeID"],
        include: [
          {
            model: GioHang_Topping,
            as: "GioHang_Toppings",
            attributes: ["ToppingID"],
          },
        ],
      });

      if (!cartItems.length) {
        await transaction.rollback();
        return res.json({
          success: false,
          message: "Không tìm thấy sản phẩm trong giỏ!",
        });
      }

      itemsToOrder = cartItems.map((item) => ({
        FoodId: item.FoodId,
        SizeID: item.SizeID,
        Quantity: item.SoLuong,
        TotalPrice: parseFloat(item.TotalPrice),
        GioHangID: item.GioHangID,
        ToppingIDs: item.GioHang_Toppings.map((gt) => gt.ToppingID),
      }));
    } else if (orderItems?.length) {
      itemsToOrder = orderItems.map((item) => ({
        FoodId: item.FoodId,
        SizeID: item.SizeID,
        Quantity: item.Quantity,
        TotalPrice: parseFloat(item.TotalPrice),
        ToppingIDs: item.ToppingIDs || [],
      }));
    } else {
      await transaction.rollback();
      return res.json({
        success: false,
        message: "Không có sản phẩm nào để đặt!",
      });
    }

    // Lấy và cập nhật địa chỉ
    const user = await Users.findByPk(req.user.id, { attributes: ["Address"] });
    if (!user) {
      await transaction.rollback();
      return res.json({
        success: false,
        message: "Không tìm thấy người dùng!",
      });
    }

    const finalAddress = newAddress?.trim() || user.Address;
    if (!finalAddress) {
      await transaction.rollback();
      return res.json({
        success: false,
        message: "Địa chỉ giao hàng không được để trống!",
      });
    }

    await Users.update(
      { Address: finalAddress },
      { where: { Id: req.user.id }, transaction }
    );

    // Tính tổng tiền
    const subtotal = itemsToOrder.reduce(
      (sum, item) => sum + item.TotalPrice,
      0
    );
    const shipping = 20000;
    const totalAmount = subtotal + shipping;

    // Lấy StatusId
    const status = await OrderStatus.findOne({
      where: { StatusName: "Đặt hàng thành công" },
      attributes: ["StatusId"],
    });
    if (!status) {
      await transaction.rollback();
      return res.json({
        success: false,
        message: "Không tìm thấy trạng thái 'Đặt hàng thành công'!",
      });
    }

    // Tạo đơn hàng
    const order = await Orders.create(
      {
        UserId: req.user.id,
        OrderDate: new Date(),
        TotalAmount: totalAmount,
        PaymentMethodId: paymentMethodId,
        StatusId: status.StatusId,
        DeliveryAddress: finalAddress,
      },
      { transaction }
    );

    // Thêm chi tiết đơn hàng
    for (const item of itemsToOrder) {
      const unitPrice = item.TotalPrice / item.Quantity;
      const orderDetail = await OrderDetails.create(
        {
          OrderId: order.OrderId,
          FoodId: item.FoodId,
          SizeId: item.SizeID,
          Quantity: item.Quantity,
          Price: unitPrice,
        },
        { transaction }
      );

      for (const toppingId of item.ToppingIDs) {
        await OrderDetails_Topping.create(
          { OrderDetailId: orderDetail.OrderDetailId, ToppingId: toppingId },
          { transaction }
        );
      }
    }

    // Xóa giỏ hàng nếu COD
    if (paymentMethodId === 2 && selectedItems?.length) {
      await GioHang.destroy({
        where: { GioHangID: { [Op.in]: selectedItems } },
        transaction,
      });
    }

    // Thanh toán VNPay
    if (paymentMethodId === 1) {
      const ipAddr =
        req.headers["x-forwarded-for"] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        "127.0.0.1";
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const paymentUrl = await vnpay.buildPaymentUrl({
        vnp_Amount: totalAmount,
        vnp_IpAddr: ipAddr,
        vnp_TxnRef: order.OrderId,
        vnp_OrderInfo: `Thanh toán đơn hàng ${order.OrderId}`,
        vnp_OrderType: ProductCode.Other,
        vnp_ReturnUrl:
          process.env.VNPAY_RETURN_URL || "http://localhost:3000/vnpay-return",
        vnp_Locale: VnpLocale.VN,
        vnp_CreateDate: dateFormat(new Date()),
        vnp_ExpireDate: dateFormat(tomorrow),
      });

      await transaction.commit();
      return res.json({
        success: true,
        Code: paymentMethodId,
        Url: paymentUrl,
      });
    }

    await transaction.commit();
    res.json({
      success: true,
      message: "Đặt hàng thành công!",
      orderId: order.OrderId,
    });
  } catch (err) {
    await transaction.rollback();
    console.error("PLACE ORDER ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi đặt hàng!",
      detail: err.message,
    });
  }
};

// =========================
// 📌 VNPAY CALLBACK
// =========================
exports.vnpayReturn = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { vnp_TxnRef, vnp_TransactionStatus, vnp_Amount } = req.query;
    const verify = vnpay.verifyReturnUrl(req.query);
    const orderId = parseInt(vnp_TxnRef);

    if (!verify.isSuccess) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Xác thực giao dịch VNPay thất bại!",
      });
    }

    if (vnp_TransactionStatus === "00") {
      // Thay vì tìm "Giao hàng thành công", giữ trạng thái "Đặt hàng thành công" (StatusId = 1)
      const statusId = 1; // Sử dụng trực tiếp StatusId = 1

      // Cập nhật trạng thái đơn hàng thành "Đặt hàng thành công"
      await Orders.update(
        { StatusId: statusId },
        { where: { OrderId: orderId }, transaction }
      );

      // Xóa giỏ hàng
      const orderDetails = await OrderDetails.findAll({
        where: { OrderId: orderId },
        attributes: ["FoodId"],
        transaction,
      });
      const foodIds = orderDetails.map((od) => od.FoodId);
      await GioHang.destroy({
        where: { FoodId: { [Op.in]: foodIds }, Id: req.user?.id || 0 },
        transaction,
      });

      await transaction.commit();
      return res.json({
        success: true,
        message: "Thanh toán thành công!",
        ThanhToanThanhCong: vnp_Amount
          ? (parseInt(vnp_Amount) / 100).toFixed(2)
          : null,
        orderId,
      });
    }

    await transaction.rollback();
    return res.json({
      success: false,
      message: "Thanh toán thất bại!",
      orderId,
    });
  } catch (err) {
    await transaction.rollback();
    console.error("VNPAY RETURN ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Lỗi xử lý giao dịch VNPay!",
      detail: err.message,
    });
  }
};
exports.authenticateToken = authenticateToken;
