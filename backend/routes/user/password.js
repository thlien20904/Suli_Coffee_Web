const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { poolPromise } = require("../../db");
const bcrypt = require("bcryptjs");

// Gửi mã OTP qua email
router.post("/forgot", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const pool = await poolPromise;
    const user = await pool
      .request()
      .input("Email", email)
      .query("SELECT * FROM Users WHERE Email = @Email");

    if (user.recordset.length === 0) {
      return res.status(404).json({ message: "Email không tồn tại" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await pool
      .request()
      .input("Email", email)
      .input("OTP", otp)
      .query(
        "UPDATE Users SET ResetToken = @OTP, ResetTokenExpiry = DATEADD(MINUTE, 10, GETDATE()) WHERE Email = @Email"
      );

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Shoe Store" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Mã đặt lại mật khẩu",
      text: `Mã OTP của bạn là: ${otp}. Có hiệu lực trong 10 phút.`,
    });

    res.json({ message: "OTP đã gửi vào email" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Xác minh OTP & đổi mật khẩu
router.post("/reset", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "Thiếu dữ liệu" });
    }

    const pool = await poolPromise;
    const user = await pool
      .request()
      .input("Email", email)
      .input("OTP", otp)
      .query(
        "SELECT * FROM Users WHERE Email = @Email AND ResetToken = @OTP AND ResetTokenExpiry > GETDATE()"
      );

    if (user.recordset.length === 0) {
      return res
        .status(400)
        .json({ message: "OTP không hợp lệ hoặc đã hết hạn" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool
      .request()
      .input("Email", email)
      .input("PasswordHash", hashedPassword) // ✅ Đổi sang PasswordHash
      .query(
        "UPDATE Users SET PasswordHash = @PasswordHash, ResetToken = NULL, ResetTokenExpiry = NULL WHERE Email = @Email"
      );

    res.json({ message: "Đặt lại mật khẩu thành công" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
