const sequelize = require("../../config/sequelize");
const initModels = require("../../models/init-models");
const models = initModels(sequelize);
const { CuaHang } = models;
const { Op } = require("sequelize");

// =========================
// 📌 LẤY DANH SÁCH TẤT CẢ CỬA HÀNG
// =========================
exports.getAllStores = async (req, res) => {
  try {
    const stores = await CuaHang.findAll({
      order: [["CuaHangId", "DESC"]],
      attributes: [
        "CuaHangId",
        "CuaHangName",
        "Address",
        "Opening_Hours",
        "Image_URL",
        "Phone",
        "Latitude",
        "Longitude",
      ],
    });
    res.json({ success: true, data: stores });
  } catch (err) {
    console.error("❌ Lỗi lấy danh sách cửa hàng:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// =========================
// 📌 LẤY CHI TIẾT MỘT CỬA HÀNG
// =========================
exports.getStoreById = async (req, res) => {
  try {
    const id = req.params.id;
    const store = await CuaHang.findByPk(id, {
      attributes: [
        "CuaHangId",
        "CuaHangName",
        "Address",
        "Opening_Hours",
        "Image_URL",
        "Phone",
        "Latitude",
        "Longitude",
      ],
    });
    if (!store) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy cửa hàng!" });
    }
    res.json({ success: true, data: store });
  } catch (err) {
    console.error("❌ Lỗi lấy chi tiết cửa hàng:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// =========================
// 📌 TÌM KIẾM CỬA HÀNG THEO TÊN HOẶC ĐỊA CHỈ
// =========================
exports.searchStores = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp từ khóa tìm kiếm",
      });
    }

    const stores = await CuaHang.findAll({
      where: {
        [Op.or]: [
          { CuaHangName: { [Op.like]: `%${query}%` } },
          { Address: { [Op.like]: `%${query}%` } },
        ],
      },
      order: [["CuaHangId", "DESC"]],
      attributes: [
        "CuaHangId",
        "CuaHangName",
        "Address",
        "Opening_Hours",
        "Image_URL",
        "Phone",
        "Latitude",
        "Longitude",
      ],
    });

    res.json({ success: true, data: stores });
  } catch (err) {
    console.error("❌ Lỗi tìm kiếm cửa hàng:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// =========================
// 📌 TÌM CỬA HÀNG GẦN NHẤT
// =========================
exports.getNearestStore = async (req, res) => {
  try {
    const { lat, lng } = req.query;
    console.log("User coords:", lat, lng);

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp tọa độ (lat, lng)",
      });
    }

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);

    if (isNaN(userLat) || isNaN(userLng)) {
      return res
        .status(400)
        .json({ success: false, message: "Tọa độ không hợp lệ" });
    }

    // Chỉ lấy cửa hàng có tọa độ hợp lệ
    const stores = await CuaHang.findAll({
      where: {
        Latitude: { [Op.ne]: null },
        Longitude: { [Op.ne]: null },
      },
      attributes: [
        "CuaHangId",
        "CuaHangName",
        "Address",
        "Opening_Hours",
        "Image_URL",
        "Phone",
        "Latitude",
        "Longitude",
        [
          sequelize.literal(`
            6371 * acos(
              cos(radians(${userLat}))
              * cos(radians(Latitude))
              * cos(radians(Longitude) - radians(${userLng}))
              + sin(radians(${userLat}))
              * sin(radians(Latitude))
            )
          `),
          "distance",
        ],
      ],
      order: [[sequelize.literal("distance"), "ASC"]],
      limit: 1,
    });

    console.log("Nearest store:", stores);

    if (!stores.length) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy cửa hàng nào" });
    }

    res.json({ success: true, data: stores[0] });
  } catch (err) {
    console.error("❌ Lỗi tìm cửa hàng gần nhất:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// =========================
// 📌 LẤY TẤT CẢ CỬA HÀNG SẮP XẾP THEO KHOẢNG CÁCH
// =========================
exports.getStoresSortedByDistance = async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp tọa độ (lat, lng)",
      });
    }

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);

    if (isNaN(userLat) || isNaN(userLng)) {
      return res
        .status(400)
        .json({ success: false, message: "Tọa độ không hợp lệ" });
    }

    const stores = await CuaHang.findAll({
      where: {
        Latitude: { [Op.ne]: null },
        Longitude: { [Op.ne]: null },
      },
      attributes: [
        "CuaHangId",
        "CuaHangName",
        "Address",
        "Opening_Hours",
        "Image_URL",
        "Phone",
        "Latitude",
        "Longitude",
        [
          sequelize.literal(`6371 * acos(
            cos(radians(${userLat}))
            * cos(radians(Latitude))
            * cos(radians(Longitude) - radians(${userLng}))
            + sin(radians(${userLat}))
            * sin(radians(Latitude))
          )`),
          "distance",
        ],
      ],
      order: [[sequelize.literal("distance"), "ASC"]],
    });

    res.json({ success: true, data: stores });
  } catch (err) {
    console.error("❌ Lỗi sắp xếp cửa hàng theo khoảng cách:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};
