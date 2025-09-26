// routes/api/auth.js
// Các API xác thực: đăng ký / đăng nhập
// - Validate dữ liệu đầu vào ở server
// - Hash mật khẩu bằng bcrypt khi đăng ký
// - Đăng nhập trả JWT; nếu remember=true -> token 30 ngày, else 2 giờ

const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { poolPromise, sql } = require("../../db");

// ====== Helpers ======

// SECRET cho JWT (đặt qua biến môi trường ở production)
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

// Ký JWT với thời gian sống tùy chọn
const signToken = (payload, expiresIn = "7d") =>
  jwt.sign(payload, JWT_SECRET, { expiresIn });

// Regex util
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((v || "").trim());
const isUsername = (v) => /^[a-zA-Z0-9_.-]{3,30}$/.test((v || "").trim());
// Mật khẩu mạnh: >=8 ký tự, có chữ thường, HOA, số, ký tự đặc biệt
const isStrongPassword = (v) =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/.test(v || "");
// SĐT VN: đúng 10 số, bắt đầu 03/05/07/08/09
const isVNPhone10 = (v) =>
  /^0(3|5|7|8|9)\d{8}$/.test((v || "").replace(/\s+/g, ""));

// Mẫu trả lỗi thống nhất
const errObj = (field, msg) => ({ field, msg });
const send400 = (res, list) => res.status(400).json({ errors: list });
const send409 = (res, list) => res.status(409).json({ errors: list });

/**
 * POST /api/auth/register
 * Body: { username, email, password, fullName, phone, address }
 * - Validate đầu vào
 * - Check trùng username/email
 * - Hash password và lưu DB
 */
router.post("/register", async (req, res) => {
  try {
    const raw = req.body || {};
    const username = (raw.username || "").trim();
    const email = (raw.email || "").trim();
    const password = raw.password || "";
    const fullName = (raw.fullName || "").trim();
    const phone = (raw.phone || "").trim();
    const address = (raw.address || "").trim();

    // Validate phía server
    const errs = [];
    if (!username) errs.push(errObj("username", "Vui lòng nhập Username."));
    else if (!isUsername(username))
      errs.push(
        errObj("username", "Username 3–30 ký tự, chỉ a-z, A-Z, 0-9, _ . -")
      );

    if (!email) errs.push(errObj("email", "Vui lòng nhập Email."));
    else if (!isEmail(email))
      errs.push(errObj("email", "Email không đúng định dạng."));

    if (!password) errs.push(errObj("password", "Vui lòng nhập Mật khẩu."));
    else if (!isStrongPassword(password))
      errs.push(
        errObj(
          "password",
          "Mật khẩu ≥8 ký tự, gồm chữ HOA, thường, số và ký tự đặc biệt."
        )
      );

    if (!fullName) errs.push(errObj("fullName", "Vui lòng nhập Họ và tên."));
    else if (fullName.length < 2)
      errs.push(errObj("fullName", "Họ tên tối thiểu 2 ký tự."));

    if (!phone) errs.push(errObj("phone", "Vui lòng nhập Số điện thoại."));
    else if (!isVNPhone10(phone))
      errs.push(errObj("phone", "SĐT phải 10 số, bắt đầu 03/05/07/08/09."));

    if (!address) errs.push(errObj("address", "Vui lòng nhập Địa chỉ."));
    else if (address.length < 5)
      errs.push(errObj("address", "Địa chỉ tối thiểu 5 ký tự."));

    if (errs.length) return send400(res, errs);

    const pool = await poolPromise;

    // Check trùng email/username
    const dup = await pool
      .request()
      .input("Email", sql.NVarChar, email)
      .input("Username", sql.NVarChar, username).query(`
        SELECT TOP 1 'EMAIL' AS What FROM Users WHERE Email = @Email
        UNION ALL
        SELECT TOP 1 'USERNAME' AS What FROM Users WHERE Username = @Username
      `);

    if (dup.recordset.length) {
      const list = dup.recordset.map((r) =>
        r.What === "EMAIL"
          ? errObj("email", "Email đã tồn tại.")
          : errObj("username", "Username đã tồn tại.")
      );
      return send409(res, list);
    }

    // Hash mật khẩu rồi insert
    const hashed = await bcrypt.hash(password, 10);

    await pool
      .request()
      .input("Username", sql.NVarChar, username)
      .input("Email", sql.NVarChar, email)
      .input("PasswordHash", sql.NVarChar, hashed)
      .input("FullName", sql.NVarChar, fullName)
      .input("Phone", sql.NVarChar, phone)
      .input("Address", sql.NVarChar, address)
      .input("Role", sql.NVarChar, "User").query(`
        INSERT INTO Users (Username, Email, PasswordHash, FullName, Phone, Address, Role)
        VALUES (@Username, @Email, @PasswordHash, @FullName, @Phone, @Address, @Role)
      `);

    return res.json({ message: "Đăng ký thành công" });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    return res.status(500).json({ errors: [errObj(null, "Lỗi máy chủ")] });
  }
});

/**
 * POST /api/auth/login
 * Body: { identifier, password, remember? }
 * - Validate
 * - So khớp mật khẩu (hash/plain – nếu DB cũ)
 * - Nếu remember=true -> token 30 ngày, ngược lại 2 giờ
 * - Nếu Role = 'Banned' => chặn đăng nhập
 */
router.post("/login", async (req, res) => {
  try {
    const raw = req.body || {};
    const identifier = (raw.identifier || "").trim();
    const password = raw.password || "";
    const remember = !!raw.remember;

    const errs = [];
    if (!identifier)
      errs.push(errObj("identifier", "Vui lòng nhập Username hoặc Email."));
    if (!password) errs.push(errObj("password", "Vui lòng nhập Mật khẩu."));
    if (errs.length) return send400(res, errs);

    const pool = await poolPromise;
    let queryField = isEmail(identifier) ? "Email" : "Username";
    const rs = await pool
      .request()
      .input("Identifier", sql.NVarChar, identifier).query(`
        SELECT TOP 1 Id, Username, Email, PasswordHash, Role, FullName, AvatarUrl
        FROM Users
        WHERE ${queryField} = @Identifier
      `);

    const user = rs.recordset[0];
    if (!user)
      return res.status(401).json({
        errors: [errObj(null, "Username/Email hoặc mật khẩu không đúng.")],
      });

    // ❌ Check tài khoản bị ban
    if (user.Role === "Banned") {
      return res.status(403).json({
        errors: [
          errObj(null, "Tài khoản của bạn đã bị khóa, vui lòng liên hệ admin."),
        ],
      });
    }

    const passInDb = user.PasswordHash || "";
    const looksHashed =
      passInDb.startsWith("$2a$") || passInDb.startsWith("$2b$");
    const ok = looksHashed
      ? await bcrypt.compare(password, passInDb)
      : password === passInDb;
    if (!ok)
      return res.status(401).json({
        errors: [errObj(null, "Username/Email hoặc mật khẩu không đúng.")],
      });

    // Nếu DB còn lưu plain text thì hash lại
    if (!looksHashed) {
      const newHash = await bcrypt.hash(password, 10);
      await pool
        .request()
        .input("Uid", sql.Int, user.Id)
        .input("Pwd", sql.NVarChar, newHash)
        .query(`UPDATE Users SET PasswordHash = @Pwd WHERE Id = @Uid`);
    }

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

    return res.json({
      token,
      role: user.Role || "User",
      expiresIn,
      user: {
        id: user.Id,
        username: user.Username,
        email: user.Email,
        fullName: user.FullName || "",
        avatar: user.AvatarUrl || null,
      },
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ errors: [errObj(null, "Lỗi máy chủ")] });
  }
});

module.exports = router;
