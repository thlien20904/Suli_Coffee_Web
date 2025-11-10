// backend/controllers/user/orders/order.js
const {
  sequelize,
  models,
  vnpay,
  ProductCode,
  VnpLocale,
  dateFormat,
  Op,
} = require("./config");
const jwt = require("jsonwebtoken");
const {
  GioHang,
  Users,
  Food,
  Size,
  GioHang_Topping,
  Topping,
  Orders,
  OrderDetails,
  Vouchers,
  UserVouchers,
  OrderDetails_Topping,
  PhuongThucThanhToan,
  OrderStatus,
  PaymentStatus,
} = models;

// Xác thực token JWT của người dùng
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

// Định dạng dữ liệu sản phẩm trong giỏ hàng
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

// Chuẩn bị dữ liệu thanh toán từ giỏ hàng
const prepareOrder = async (req, res) => {
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

// ===================== PLACE ORDER =====================
const placeOrder = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      newAddress,
      paymentMethodId, // 1 = VNPay, 2 = COD
      selectedItems,
      orderItems,
      voucherCode,
      pendingOrderId,
    } = req.body;

    let itemsToOrder = [];

    // -------------------- Xử lý nguồn dữ liệu --------------------
    if (pendingOrderId) {
      const pendingOrder = await Orders.findOne({
        where: { OrderId: pendingOrderId, UserId: req.user.id },
        include: [
          {
            model: OrderDetails,
            as: "OrderDetails",
            include: [
              { model: Food, as: "Food" },
              { model: Size, as: "Size" },
              {
                model: OrderDetails_Topping,
                as: "OrderDetails_Toppings",
                include: [{ model: Topping, as: "Topping" }],
              },
            ],
          },
        ],
        transaction,
      });

      if (!pendingOrder) {
        await transaction.rollback();
        return res.json({
          success: false,
          message: "Không tìm thấy đơn hàng lưu tạm!",
        });
      }

      itemsToOrder = pendingOrder.OrderDetails.map((d) => ({
        FoodId: d.Food.FoodId,
        SizeID: d.Size?.SizeID || null,
        Quantity: d.Quantity,
        TotalPrice: d.Price * d.Quantity,
        ToppingIDs: d.OrderDetails_Toppings.map((ot) => ot.Topping.ToppingID),
      }));

      await Orders.destroy({ where: { OrderId: pendingOrderId }, transaction });
    } else if (selectedItems?.length) {
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

    // -------------------- Địa chỉ --------------------
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

    // -------------------- Tính tiền --------------------
    const subtotal = itemsToOrder.reduce(
      (sum, item) => sum + item.TotalPrice,
      0
    );
    const shipping = 20000;
    let discountAmount = 0;
    let appliedVoucherId = null;

    if (voucherCode) {
      const userVoucher = await UserVouchers.findOne({
        where: { UserId: req.user.id, IsUsed: false },
        include: [
          {
            model: Vouchers,
            as: "Voucher",
            where: { Code: voucherCode, IsActive: true },
          },
        ],
        transaction,
      });

      if (!userVoucher) {
        await transaction.rollback();
        return res.json({
          success: false,
          message: "Voucher không hợp lệ hoặc đã dùng!",
        });
      }

      const voucher = userVoucher.Voucher;
      appliedVoucherId = voucher.VoucherId;

      if (voucher.DiscountAmount)
        discountAmount = parseFloat(voucher.DiscountAmount);
      else if (voucher.DiscountPercentage)
        discountAmount =
          (subtotal * parseFloat(voucher.DiscountPercentage)) / 100;

      await userVoucher.update({ IsUsed: true }, { transaction });
    }

    const totalAmount = subtotal + shipping - discountAmount;

    // -------------------- Trạng thái đơn hàng --------------------
    const orderStatus = await OrderStatus.findOne({
      where: { StatusName: "Đặt hàng thành công" },
    });

    const [pendingPayment] = await PaymentStatus.findOrCreate({
      where: { PaymentStatusName: "Chờ thanh toán" },
      defaults: { PaymentStatusName: "Chờ thanh toán" },
      transaction,
    });

    const [paidStatus] = await PaymentStatus.findOrCreate({
      where: { PaymentStatusName: "Đã thanh toán" },
      defaults: { PaymentStatusName: "Đã thanh toán" },
      transaction,
    });

    // -------------------- Tạo đơn hàng --------------------
    const order = await Orders.create(
      {
        UserId: req.user.id,
        OrderDate: new Date(),
        TotalAmount: totalAmount,
        PaymentMethodId: paymentMethodId,
        StatusId: orderStatus?.StatusId,
        DeliveryAddress: finalAddress,
        VoucherId: appliedVoucherId,
        PaymentStatusId:
          paymentMethodId === 1
            ? pendingPayment.PaymentStatusId // VNPay → Chờ thanh toán
            : pendingPayment.PaymentStatusId, // COD → cũng là "Chờ thanh toán" (ID = 1)
      },
      { transaction }
    );

    // -------------------- Chi tiết đơn hàng --------------------
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

    if (selectedItems?.length) {
      await GioHang.destroy({
        where: { GioHangID: { [Op.in]: selectedItems } },
        transaction,
      });
    }

    // -------------------- Nếu là VNPay --------------------
    if (paymentMethodId === 1) {
      const ipAddr =
        req.headers["x-forwarded-for"] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        "127.0.0.1";

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      // ✅ tránh lỗi giao dịch trùng
      const uniqueTxnRef = `${order.OrderId}_${Date.now()}`;

      const paymentUrl = await vnpay.buildPaymentUrl({
        vnp_Amount: totalAmount,
        vnp_IpAddr: ipAddr,
        vnp_TxnRef: uniqueTxnRef,
        vnp_OrderInfo: `Thanh toán đơn hàng #${order.OrderId}`,
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

    // -------------------- Nếu là COD --------------------
    await transaction.commit();
    return res.json({
      success: true,
      message: "Đặt hàng thành công (COD)!",
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

// ===================== VNPAY RETURN =====================
const vnpayReturn = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { vnp_TxnRef, vnp_TransactionStatus, vnp_Amount } = req.query;

    const orderId = parseInt(vnp_TxnRef.split("_")[0]);
    let verify;

    try {
      verify = vnpay.verifyReturnUrl(req.query);
    } catch {
      await Orders.update(
        { PaymentStatusId: await getPaymentStatusId("Thanh toán thất bại") },
        { where: { OrderId: orderId }, transaction }
      );
      await transaction.commit();
      return res.json({
        success: false,
        message: "Xác thực giao dịch VNPay thất bại (verify error).",
      });
    }

    if (!verify.isSuccess || vnp_TransactionStatus !== "00") {
      await Orders.update(
        { PaymentStatusId: await getPaymentStatusId("Thanh toán thất bại") },
        { where: { OrderId: orderId }, transaction }
      );
      await transaction.commit();
      return res.json({ success: false, message: "Thanh toán thất bại!" });
    }

    // ✅ Thành công
    await Orders.update(
      {
        PaymentStatusId: await getPaymentStatusId("Đã thanh toán"),
        StatusId: await getOrderStatusId("Đặt hàng thành công"),
      },
      { where: { OrderId: orderId }, transaction }
    );

    await transaction.commit();
    return res.json({
      success: true,
      message: "Thanh toán VNPay thành công!",
      amount: (parseInt(vnp_Amount) / 100).toFixed(0),
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

// ===================== HÀM HỖ TRỢ =====================
async function getPaymentStatusId(name) {
  const [record] = await PaymentStatus.findOrCreate({
    where: { PaymentStatusName: name },
    defaults: { PaymentStatusName: name },
  });
  return record.PaymentStatusId;
}

async function getOrderStatusId(name) {
  const record = await OrderStatus.findOne({ where: { StatusName: name } });
  return record?.StatusId || null;
}

// Đặt lại đơn hàng đã hủy, thêm sản phẩm vào giỏ hàng
const reOrder = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { orderId } = req.params;
    const cancelledOrder = await Orders.findOne({
      where: { OrderId: orderId, UserId: req.user.id, StatusId: 5 }, // StatusId: 5 là Đã hủy
      include: [
        {
          model: OrderDetails,
          as: "OrderDetails",
          include: [
            { model: Food, as: "Food" },
            { model: Size, as: "Size" },
            {
              model: OrderDetails_Topping,
              as: "OrderDetails_Toppings",
              include: [{ model: Topping, as: "Topping" }],
            },
          ],
        },
      ],
      transaction,
    });
    if (!cancelledOrder) {
      await transaction.rollback();
      return res.json({
        success: false,
        message: "Không tìm thấy đơn hàng đã hủy!",
      });
    }
    // Add items back to cart
    const itemsToAdd = cancelledOrder.OrderDetails.map((d) => ({
      FoodId: d.Food.FoodId,
      SizeID: d.Size?.SizeID || null,
      Quantity: d.Quantity,
      TotalPrice: d.Price * d.Quantity,
      ToppingIDs: d.OrderDetails_Toppings.map((ot) => ot.Topping.ToppingID),
    }));
    for (const item of itemsToAdd) {
      const cartItem = await GioHang.create(
        {
          Id: req.user.id,
          FoodId: item.FoodId,
          SizeID: item.SizeID,
          SoLuong: item.Quantity,
          TotalPrice: item.TotalPrice,
        },
        { transaction }
      );
      for (const toppingId of item.ToppingIDs) {
        await GioHang_Topping.create(
          { GioHangID: cartItem.GioHangID, ToppingID: toppingId },
          { transaction }
        );
      }
    }
    await transaction.commit();
    res.json({ success: true, message: "Đã thêm sản phẩm vào giỏ hàng!" });
  } catch (err) {
    await transaction.rollback();
    console.error("REORDER ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Lỗi khi đặt lại đơn hàng!",
      detail: err.message,
    });
  }
};

module.exports = {
  authenticateToken,
  formatItem,
  prepareOrder,
  placeOrder,
  vnpayReturn,
  reOrder,
};
