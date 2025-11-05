const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sequelize = require("../../config/sequelize");
const { Op } = require("sequelize"); // Import Op từ sequelize
const initModels = require("../../models/init-models");
const models = initModels(sequelize);
const { Users } = models;

// ====== Helpers ======

// SECRET cho JWT (từ .env)
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_fallback";

// Ký JWT với thời gian sống tùy chọn
const signToken = (payload, expiresIn = "7d") =>
  jwt.sign(payload, JWT_SECRET, { expiresIn });

// Regex util
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((v || "").trim());
const isUsername = (v) => /^[a-zA-Z0-9_.-]{3,30}$/.test((v || "").trim());
const isStrongPassword = (v) =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/.test(v || "");
const isVNPhone10 = (v) =>
  /^0(3|5|7|8|9)\d{8}$/.test((v || "").replace(/\s+/g, ""));
const errObj = (field, msg) => ({ field, msg });

// =========================
// 📌 ĐĂNG KÝ NGƯỜI DÙNG
// =========================
exports.register = async (req, res) => {
  try {
    const { username, email, password, fullName, phone, address } = req.body;

    // Validate đầu vào
    const errs = [];
    if (!username || !isUsername(username))
      errs.push(
        errObj("username", "Username 3–30 ký tự, chỉ a-z, A-Z, 0-9, _ . -")
      );
    if (!email || !isEmail(email))
      errs.push(errObj("email", "Email không đúng định dạng."));
    if (!password || !isStrongPassword(password))
      errs.push(
        errObj(
          "password",
          "Mật khẩu ≥8 ký tự, gồm chữ HOA, thường, số và ký tự đặc biệt."
        )
      );
    if (!fullName || fullName.length < 2)
      errs.push(errObj("fullName", "Họ tên tối thiểu 2 ký tự."));
    if (!phone || !isVNPhone10(phone))
      errs.push(errObj("phone", "SĐT phải 10 số, bắt đầu 03/05/07/08/09."));
    if (!address || address.length < 5)
      errs.push(errObj("address", "Địa chỉ tối thiểu 5 ký tự."));

    if (errs.length)
      return res.status(400).json({ success: false, errors: errs });

    // Kiểm tra trùng username/email
    const exists = await Users.findOne({
      where: { [Op.or]: [{ Username: username }, { Email: email }] },
    });
    if (exists) {
      const errors = [];
      if (exists.Username === username)
        errors.push(errObj("username", "Username đã tồn tại."));
      if (exists.Email === email)
        errors.push(errObj("email", "Email đã tồn tại."));
      return res.status(409).json({ success: false, errors });
    }

    // Hash mật khẩu và tạo người dùng
    const hashed = await bcrypt.hash(password, 10);
    const newUser = await Users.create({
      Username: username,
      Email: email,
      PasswordHash: hashed,
      FullName: fullName,
      Phone: phone,
      Address: address,
      Role: "User",
    });

    res.status(201).json({
      success: true,
      message: "Đăng ký thành công!",
      data: {
        id: newUser.Id,
        username: newUser.Username,
        email: newUser.Email,
        fullName: newUser.FullName,
      },
    });
  } catch (err) {
    console.error("❌ Lỗi đăng ký người dùng:", err);
    if (
      err.name === "SequelizeValidationError" ||
      err.name === "SequelizeUniqueConstraintError"
    ) {
      return res
        .status(400)
        .json({ success: false, message: err.errors[0].message });
    }
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// =========================
// 📌 ĐĂNG NHẬP NGƯỜI DÙNG
// =========================
exports.login = async (req, res) => {
  try {
    const { identifier, password, remember } = req.body;

    // Validate đầu vào
    const errs = [];
    if (!identifier)
      errs.push(errObj("identifier", "Vui lòng nhập Username hoặc Email."));
    if (!password) errs.push(errObj("password", "Vui lòng nhập Mật khẩu."));
    if (errs.length)
      return res.status(400).json({ success: false, errors: errs });

    // Tìm người dùng
    const user = await Users.findOne({
      where: {
        [Op.or]: [{ Username: identifier }, { Email: identifier }],
      },
    });
    if (!user)
      return res.status(401).json({
        success: false,
        errors: [errObj(null, "Username/Email hoặc mật khẩu không đúng.")],
      });

    // So khớp mật khẩu
    const passInDb = user.PasswordHash || "";
    const looksHashed =
      passInDb.startsWith("$2a$") || passInDb.startsWith("$2b$");
    const ok = looksHashed
      ? await bcrypt.compare(password, passInDb)
      : password === passInDb;
    if (!ok)
      return res.status(401).json({
        success: false,
        errors: [errObj(null, "Username/Email hoặc mật khẩu không đúng.")],
      });

    // Nếu mật khẩu lưu dạng plain text, hash lại
    if (!looksHashed) {
      const newHash = await bcrypt.hash(password, 10);
      user.PasswordHash = newHash;
      await user.save();
    }

    // Tạo JWT
    const expiresIn = remember ? "30d" : "2h";
    const token = signToken(
      {
        id: user.Id,
        role: user.Role || "User",
        username: user.Username,
        email: user.Email,
        avatar: user.AvatarUrl || null,
      },
      expiresIn
    );

    res.json({
      success: true,
      token,
      role: user.Role || "User",
      expiresIn,
      data: {
        id: user.Id,
        username: user.Username,
        email: user.Email,
        fullName: user.FullName || "",
        avatar: user.AvatarUrl || null,
      },
    });
  } catch (err) {
    console.error("❌ Lỗi đăng nhập:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// =========================
// 📌 ĐĂNG XUẤT (CLIENT-SIDE)
// =========================
exports.logout = async (req, res) => {
  try {
    res.json({
      success: true,
      message: "Đăng xuất thành công. Token đã hết hạn.",
    });
  } catch (err) {
    console.error("❌ Lỗi đăng xuất:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};
