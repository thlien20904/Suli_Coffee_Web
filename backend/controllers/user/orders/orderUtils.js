// orderUtils.js
const axios = require("axios"); // ✅ Thêm dòng này
const { sequelize, models, Op } = require("./config"); // dùng config.js cùng cấp
const jwt = require("jsonwebtoken");

// Nếu cần destructure thêm các model
const { CuaHang, DeliveryAddresses, FoodDimensions } = models;

// ✅ Hàm tính khoảng cách giữa 2 tọa độ bằng công thức Haversine (km)
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Bán kính Trái Đất (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/// Hàm lấy tọa độ từ địa chỉ bằng Google Maps Geocoding API
async function getCoordinatesFromAddress(address, ward, district, province) {
  try {
    const fullAddress = `${address}, ${ward}, ${district}, ${province}, Vietnam`;
    const encodedAddress = encodeURIComponent(fullAddress);
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.warn("Thiếu GOOGLE_MAPS_API_KEY, trả về tọa độ mặc định.");
      return { latitude: null, longitude: null };
    }
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;
    console.log("Calling Google Maps API:", url); // Debug
    const response = await axios.get(url);

    if (response.data.status !== "OK" || !response.data.results.length) {
      console.warn(`Không tìm thấy tọa độ cho địa chỉ: ${fullAddress}`);
      return { latitude: null, longitude: null };
    }

    const { lat, lng } = response.data.results[0].geometry.location;
    return { latitude: lat, longitude: lng };
  } catch (err) {
    console.error("Geocoding error:", err.message);
    return { latitude: null, longitude: null };
  }
}

// Hàm lấy thông tin tỉnh, quận, phường từ GHN API
async function getGHNLocationNames(provinceId, districtId, wardCode) {
  try {
    const apiBase = process.env.GHN_API;
    const token = process.env.GHN_TOKEN;
    if (!apiBase) throw new Error("Thiếu GHN_API trong file .env!");
    if (!token) throw new Error("Thiếu GHN_TOKEN trong file .env!");

    console.log("Calling GHN API for province:", provinceId);
    const provinceRes = await axios.get(`${apiBase}/province`, {
      headers: { Token: token },
    });
    const province = provinceRes.data.data.find(
      (p) => p.ProvinceID === parseInt(provinceId)
    );

    console.log("Calling GHN API for district:", districtId);
    const districtRes = await axios.get(
      `${apiBase}/district?province_id=${provinceId}`,
      { headers: { Token: token } }
    );
    const district = districtRes.data.data.find(
      (d) => d.DistrictID === parseInt(districtId)
    );

    console.log("Calling GHN API for ward:", wardCode);
    const wardRes = await axios.get(
      `${apiBase}/ward?district_id=${districtId}`,
      { headers: { Token: token } }
    );
    const ward = wardRes.data.data.find((w) => w.WardCode === String(wardCode));

    return {
      province: province?.ProvinceName || "",
      district: district?.DistrictName || "",
      ward: ward?.WardName || "",
    };
  } catch (err) {
    console.error("GHN location error:", err.message, err.stack);
    return { province: "", district: "", ward: "" };
  }
}
// =================== AUTH TOKEN ===================
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

// =================== 1. LẤY DANH SÁCH CỬA HÀNG ===================
const getStores = async (req, res) => {
  try {
    // Lấy tọa độ người dùng từ query params (optional)
    const { userLat, userLng, maxDistance = 15 } = req.query;

    console.log("🔍 getStores called with params:", {
      userLat,
      userLng,
      maxDistance,
    });

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

    console.log(`📦 Found ${stores.length} stores in database`);

    // ✅ Nếu có tọa độ user, filter cửa hàng trong bán kính maxDistance (km)
    let filteredStores = stores;
    if (userLat && userLng) {
      const lat = parseFloat(userLat);
      const lng = parseFloat(userLng);
      const maxDist = parseFloat(maxDistance);

      console.log(
        "📍 Filtering stores by distance. User location:",
        { lat, lng },
        "Max distance:",
        maxDist
      );

      if (!isNaN(lat) && !isNaN(lng) && !isNaN(maxDist)) {
        filteredStores = stores
          .map((store) => {
            if (!store.Latitude || !store.Longitude) {
              return { ...store.toJSON(), distance: null };
            }
            const distance = getDistance(
              lat,
              lng,
              store.Latitude,
              store.Longitude
            );
            return { ...store.toJSON(), distance: distance.toFixed(2) };
          })
          .filter(
            (store) =>
              store.distance === null || parseFloat(store.distance) <= maxDist
          )
          .sort((a, b) => {
            // Sắp xếp theo khoảng cách (gần nhất lên đầu)
            if (a.distance === null) return 1;
            if (b.distance === null) return -1;
            return parseFloat(a.distance) - parseFloat(b.distance);
          });

        console.log(
          `✅ Filtered ${filteredStores.length}/${stores.length} stores within ${maxDist}km`
        );
      }
    }

    res.json({ success: true, data: filteredStores });
  } catch (err) {
    console.error("GET STORES ERROR:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// =================== 2. LẤY ĐỊA CHỈ NGƯỜI DÙNG ===================
const getUserAddresses = async (req, res) => {
  try {
    const addresses = await DeliveryAddresses.findAll({
      where: { UserId: req.user.id },
      attributes: [
        "DeliveryAddressId",
        "Address",
        "Province",
        "ProvinceId",
        "District",
        "DistrictId",
        "Ward",
        "WardCode",
        "ReceiverName",
        "Phone",
        "IsDefault",
      ],
      order: [
        ["IsDefault", "DESC"],
        ["CreatedDate", "DESC"],
      ],
    });
    res.json({ success: true, data: addresses });
  } catch (err) {
    console.error("GET ADDRESSES ERROR:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// Cập nhật saveUserAddress
const saveUserAddress = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      address,
      province,
      provinceId,
      district,
      districtId,
      ward,
      wardCode,
      receiverName,
      phone,
      isDefault = false,
    } = req.body;

    if (!address || !province || !district || !ward || !phone) {
      return res
        .status(400)
        .json({ success: false, message: "Thiếu thông tin địa chỉ!" });
    }

    // Kiểm tra định dạng số điện thoại
    if (!/^[0][0-9]{9}$/.test(phone)) {
      return res
        .status(400)
        .json({ success: false, message: "Số điện thoại không hợp lệ!" });
    }

    const existing = await DeliveryAddresses.findOne({
      where: { UserId: req.user.id, Address: address, Phone: phone },
      transaction,
    });

    if (existing) {
      await transaction.commit();
      return res.json({
        success: true,
        message: "Địa chỉ đã tồn tại!",
        addressId: existing.DeliveryAddressId,
      });
    }

    // Lấy tọa độ từ địa chỉ
    const { latitude, longitude } = await getCoordinatesFromAddress(
      address,
      ward,
      district,
      province
    );

    const newAddr = await DeliveryAddresses.create(
      {
        UserId: req.user.id,
        Address: address,
        Province: province,
        ProvinceId: parseInt(provinceId) || null,
        District: district,
        DistrictId: parseInt(districtId) || null,
        Ward: ward,
        WardCode: wardCode ? String(wardCode) : null,
        ReceiverName: receiverName,
        Phone: phone,
        IsDefault: isDefault,
        Latitude: latitude,
        Longitude: longitude,
        CreatedDate: new Date(),
      },
      { transaction }
    );

    if (isDefault) {
      await DeliveryAddresses.update(
        { IsDefault: false },
        {
          where: {
            UserId: req.user.id,
            DeliveryAddressId: { [Op.ne]: newAddr.DeliveryAddressId },
          },
          transaction,
        }
      );
    }

    await transaction.commit();
    res.json({
      success: true,
      message: "Lưu địa chỉ thành công!",
      addressId: newAddr.DeliveryAddressId,
    });
  } catch (err) {
    await transaction.rollback();
    console.error("SAVE ADDRESS ERROR:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// =================== 4. TÍNH PHÍ SHIP ===================
// Tính phí ship
const calculateShippingFee = async (req, res) => {
  try {
    console.log("=== Calculate Shipping Fee Request ===");
    console.log("Request body:", req.body);
    const {
      cuaHangId,
      address,
      provinceId,
      districtId,
      wardCode,
      items,
      userId,
    } = req.body;
    if (!cuaHangId || !items?.length) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin cửa hàng hoặc sản phẩm!",
      });
    }
    const cuaHang = await CuaHang.findByPk(cuaHangId, {
      attributes: ["Latitude", "Longitude"],
    });
    if (!cuaHang || !cuaHang.Latitude || !cuaHang.Longitude) {
      return res.status(400).json({
        success: false,
        message: "Không tìm thấy cửa hàng hoặc cửa hàng chưa có tọa độ!",
      });
    }
    let userLat, userLng;
    if (userId && address && provinceId && districtId && wardCode) {
      const savedAddress = await DeliveryAddresses.findOne({
        where: {
          UserId: userId,
          Address: address,
          ProvinceId: parseInt(provinceId),
          DistrictId: parseInt(districtId),
          WardCode: String(wardCode),
        },
      });
      if (savedAddress && savedAddress.Latitude && savedAddress.Longitude) {
        userLat = savedAddress.Latitude;
        userLng = savedAddress.Longitude;
        console.log("User coordinates from DB:", { userLat, userLng });
      }
    }
    if (!userLat || !userLng) {
      if (!address || !provinceId || !districtId || !wardCode) {
        return res.json({
          success: true,
          shippingFee: 10000,
          distance: 0,
          message: "Thiếu thông tin địa chỉ, áp dụng phí mặc định.",
        });
      }
      const { province, district, ward } = await getGHNLocationNames(
        provinceId,
        districtId,
        wardCode
      );
      if (!province || !district || !ward) {
        return res.status(400).json({
          success: false,
          message: "Không tìm thấy thông tin tỉnh, quận, phường!",
        });
      }
      const { latitude, longitude } = await getCoordinatesFromAddress(
        address,
        ward,
        district,
        province
      );
      if (!latitude || !longitude) {
        return res.json({
          success: true,
          shippingFee: 10000,
          distance: 0,
          message: "Không lấy được tọa độ, áp dụng phí mặc định.",
        });
      }
      userLat = latitude;
      userLng = longitude;
      console.log("User coordinates from Geocoding API:", { userLat, userLng });
    }
    if (
      isNaN(userLat) ||
      isNaN(userLng) ||
      userLat < -90 ||
      userLat > 90 ||
      userLng < -180 ||
      userLng > 180
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Tọa độ người dùng không hợp lệ!" });
    }
    // ✅ Sử dụng hàm getDistance đã được định nghĩa ở đầu file
    const distance = getDistance(
      cuaHang.Latitude,
      cuaHang.Longitude,
      userLat,
      userLng
    );
    console.log("CuaHang coordinates:", {
      lat: cuaHang.Latitude,
      lng: cuaHang.Longitude,
    });
    console.log("Distance (km):", distance);
    if (distance > 20) {
      return res.status(400).json({
        success: false,
        message: "Khoảng cách giao hàng quá xa (tối đa 20km)!",
      });
    }
    const shippingFee = Math.min(
      Math.max(Math.ceil(distance) * 5000, 10000),
      50000
    );
    console.log("Calculated shipping fee:", shippingFee);
    res.json({
      success: true,
      shippingFee,
      distance: distance.toFixed(2),
    });
  } catch (err) {
    console.error("CALCULATE SHIPPING FEE ERROR:", err.stack);
    res
      .status(500)
      .json({ success: false, message: "Lỗi server", error: err.message });
  }
};

// ✅ Geocode địa chỉ sử dụng OpenStreetMap Nominatim (miễn phí, không cần API key)
const geocodeAddress = async (req, res) => {
  try {
    const { address, ward, district, province } = req.body;

    if (!address || !province) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin địa chỉ!",
      });
    }

    const fullAddress = `${address}, ${ward || ""}, ${
      district || ""
    }, ${province}, Vietnam`;
    console.log("🔍 Geocoding address:", fullAddress);

    // Sử dụng Nominatim API (OpenStreetMap) - miễn phí
    const encodedAddress = encodeURIComponent(fullAddress);
    const url = `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&limit=1`;

    const response = await axios.get(url, {
      headers: {
        "User-Agent": "SuLi-Coffee-App/1.0", // Nominatim yêu cầu User-Agent
      },
    });

    if (response.data && response.data.length > 0) {
      const { lat, lon } = response.data[0];
      console.log("✅ Geocoded coordinates:", { lat, lon });
      return res.json({
        success: true,
        data: {
          latitude: parseFloat(lat),
          longitude: parseFloat(lon),
        },
      });
    } else {
      // ✅ Fallback: Thử geocode với district + province (ít chi tiết hơn)
      console.warn(
        "⚠️ Không tìm thấy tọa độ cho địa chỉ đầy đủ, thử với district..."
      );
      const fallbackAddress = `${district || ""}, ${province}, Vietnam`;
      const fallbackUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        fallbackAddress
      )}&format=json&limit=1`;

      try {
        const fallbackResponse = await axios.get(fallbackUrl, {
          headers: { "User-Agent": "SuLi-Coffee-App/1.0" },
        });

        if (fallbackResponse.data && fallbackResponse.data.length > 0) {
          const { lat, lon } = fallbackResponse.data[0];
          console.log("✅ Geocoded using district fallback:", { lat, lon });
          return res.json({
            success: true,
            data: {
              latitude: parseFloat(lat),
              longitude: parseFloat(lon),
            },
          });
        }
      } catch (fallbackErr) {
        console.error("Fallback geocode error:", fallbackErr.message);
      }

      // ✅ Last resort: Tọa độ mặc định cho các tỉnh/thành phố lớn
      const defaultCoordinates = {
        "Hà Nội": { latitude: 21.0285, longitude: 105.8542 },
        "Thành phố Hà Nội": { latitude: 21.0285, longitude: 105.8542 },
        "Hồ Chí Minh": { latitude: 10.8231, longitude: 106.6297 },
        "Thành phố Hồ Chí Minh": { latitude: 10.8231, longitude: 106.6297 },
        "Đà Nẵng": { latitude: 16.0544, longitude: 108.2022 },
        "Thành phố Đà Nẵng": { latitude: 16.0544, longitude: 108.2022 },
      };

      for (const [cityName, coords] of Object.entries(defaultCoordinates)) {
        if (province && province.includes(cityName)) {
          console.log(`✅ Using default coordinates for ${cityName}:`, coords);
          return res.json({
            success: true,
            data: coords,
          });
        }
      }

      console.warn("⚠️ Không tìm thấy tọa độ cho địa chỉ:", fullAddress);
      return res.json({
        success: false,
        message: "Không tìm thấy tọa độ cho địa chỉ này",
      });
    }
  } catch (err) {
    console.error("GEOCODE ERROR:", err.message);
    res.status(500).json({
      success: false,
      message: "Lỗi khi geocode địa chỉ",
      error: err.message,
    });
  }
};

module.exports = {
  authenticateToken,
  getStores,
  getUserAddresses,
  saveUserAddress,
  calculateShippingFee,
  geocodeAddress, // ✅ Thêm hàm mới
};
