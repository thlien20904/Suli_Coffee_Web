const { sequelize, models } = require("./config");
const {
  Orders,
  ShippingOrders,
  PaymentStatus,
  OrderStatus,
  OrderDetails,
  Food,
  Size,
  OrderDetails_Topping,
  Topping,
  GioHang,
  GioHang_Topping,
} = models;
const { VNPay } = require("vnpay");

// Cấu hình VNPay
const vnpay = new VNPay({
  tmnCode: process.env.VNPAY_TMN_CODE || "4Z1QBO45",
  secureSecret:
    process.env.VNPAY_SECURE_SECRET || "XQBSS9ZDQJCIKDZZ108ABV5RP6B32FOH",
  vnpayHost: "https://sandbox.vnpayment.vn",
  testMode: true,
  hashAlgorithm: "SHA512",
});

async function getPaymentStatusId(name) {
  const [record] = await PaymentStatus.findOrCreate({
    where: { PaymentStatusName: name },
    defaults: { PaymentStatusName: name },
  });
  return record.PaymentStatusId;
}

async function getOrderStatusId(name) {
  const record = await OrderStatus.findOne({
    where: { StatusName: name },
  });
  return record?.StatusId || null;
}

const vnpayReturn = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { vnp_TxnRef, vnp_TransactionStatus, vnp_Amount } = req.query;
    const orderId = parseInt(vnp_TxnRef); // vnp_TxnRef là orderId

    let verify;
    try {
      verify = vnpay.verifyReturnUrl(req.query);
    } catch (err) {
      console.error("VNPay verify error:", err);
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

    // Thanh toán thành công
    const orderStatusId = await getOrderStatusId("Đặt hàng thành công");
    await Orders.update(
      {
        PaymentStatusId: await getPaymentStatusId("Đã thanh toán"),
        StatusId: orderStatusId,
      },
      { where: { OrderId: orderId }, transaction }
    );

    await ShippingOrders.update(
      { Status: "ready" },
      { where: { OrderId: orderId }, transaction }
    );

    // Xóa giỏ hàng
    const order = await Orders.findByPk(orderId, { transaction });
    if (order?.UserId) {
      await GioHang.destroy({ where: { Id: order.UserId }, transaction });
    }

    await transaction.commit();
    // Lấy chi tiết đơn hàng đầy đủ để frontend hiển thị giống màn hình success
    try {
      const orderFull = await Orders.findOne({
        where: { OrderId: orderId },
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
          { model: OrderStatus, as: "Status", attributes: ["StatusName"] },
          {
            model: PaymentStatus,
            as: "PaymentStatus",
            attributes: ["PaymentStatusName", "PaymentStatusId"],
          },
          {
            model: models.PhuongThucThanhToan,
            as: "PaymentMethod",
            attributes: ["TenPhuongThuc"],
          },
        ],
      });

      // Format items with fallback: if OrderDetails.Price missing/0, compute from food/size/toppings
      const items = (orderFull?.OrderDetails || []).map((d) => {
        const toppingSum = (d.OrderDetails_Toppings || []).reduce(
          (s, ot) => s + (parseFloat(ot.Topping?.ToppingPrice) || 0),
          0
        );
        const foodBase =
          d.Food && (d.Food.DiscountPrice || d.Food.Price)
            ? parseFloat(d.Food.DiscountPrice || d.Food.Price)
            : 0;
        const sizeExtra = d.Size ? parseFloat(d.Size.ExtraPrice || 0) : 0;
        const computedUnit = foodBase + sizeExtra + toppingSum;
        const unitPrice =
          d.Price !== undefined && d.Price !== null && Number(d.Price) > 0
            ? parseFloat(d.Price)
            : computedUnit;

        return {
          FoodId: d.Food?.FoodId,
          FoodName: d.Food?.FoodName,
          ImageURL: d.Food?.ImageURL,
          Price: unitPrice,
          DiscountPrice: d.Food?.DiscountPrice
            ? parseFloat(d.Food.DiscountPrice)
            : null,
          Size: d.Size
            ? {
                SizeID: d.Size.SizeID,
                SizeName: d.Size.SizeName,
                ExtraPrice: d.Size.ExtraPrice,
              }
            : null,
          Toppings: (d.OrderDetails_Toppings || []).map((ot) => ({
            ToppingID: ot.Topping?.ToppingID,
            ToppingName: ot.Topping?.ToppingName,
            ToppingPrice: parseFloat(ot.Topping?.ToppingPrice || 0),
          })),
          Quantity: d.Quantity,
          TotalPrice: unitPrice * (d.Quantity || 1),
        };
      });

      const formattedOrder = {
        OrderId: orderFull?.OrderId || orderId,
        OrderDate: orderFull?.OrderDate,
        TotalAmount:
          parseFloat(orderFull?.TotalAmount) ||
          items.reduce((s, it) => s + (it.TotalPrice || 0), 0),
        Status: orderFull?.Status?.StatusName || null,
        PaymentStatus: orderFull?.PaymentStatus?.PaymentStatusName || null,
        PaymentMethod: orderFull?.PaymentMethod?.TenPhuongThuc || null,
        DeliveryAddress: orderFull?.DeliveryAddress || null,
        OrderDetails: items,
      };

      return res.json({
        success: true,
        message: "Thanh toán VNPay thành công!",
        ThanhToanThanhCong: vnp_Amount
          ? (parseInt(vnp_Amount) / 100).toFixed(2)
          : null,
        orderId,
        data: formattedOrder,
      });
    } catch (errFetch) {
      // Nếu lấy chi tiết lỗi, vẫn trả response thành công nhưng không có data
      console.error("Error fetching full order after vnpay commit:", errFetch);
      return res.json({
        success: true,
        message: "Thanh toán VNPay thành công!",
        ThanhToanThanhCong: vnp_Amount
          ? (parseInt(vnp_Amount) / 100).toFixed(2)
          : null,
        orderId,
      });
    }
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

const reOrder = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { orderId } = req.params;
    const cancelledOrder = await Orders.findOne({
      where: { OrderId: orderId, UserId: req.user.id, StatusId: 5 },
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

module.exports = { vnpayReturn, reOrder };
