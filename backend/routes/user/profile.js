// routes/user/profile.js
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const { poolPromise } = require("../../db"); // Giả sử db.js ở root

// Multer cho upload avatar (đã config trong server.js)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// Middleware verify token (tái sử dụng từ /api/current_user)
const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ message: "Chưa đăng nhập" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Token không hợp lệ" });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: "Token hết hạn" });
    req.user = decoded;
    next();
  });
};

// GET /api/profile - Lấy thông tin user (bao gồm AvatarURL và Phone)
router.get("/", verifyToken, async (req, res) => {
  try {
    const pool = await poolPromise;
    const user = await pool
      .request()
      .input("UserID", req.user.id) // Từ decoded token
      .query(
        "SELECT UserID, Username, Email, Phone, AvatarURL FROM Users WHERE UserID = @UserID"
      );

    if (user.recordset.length === 0)
      return res.status(404).json({ message: "Không tìm thấy user" });

    // Trim email nếu có khoảng trắng lạ
    const userData = user.recordset[0];
    userData.Email = userData.Email.trim();

    res.json({
      id: userData.UserID,
      username: userData.Username,
      email: userData.Email,
      phone: userData.Phone || "", // Trả rỗng nếu null
      avatar: userData.AvatarURL || null, // URL từ Google hoặc uploads
    });
  } catch (err) {
    console.error("Profile GET error:", err);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
});

// PUT /api/profile/upload - Upload avatar mới (override AvatarURL)
router.put(
  "/upload",
  verifyToken,
  upload.single("avatar"),
  async (req, res) => {
    try {
      let avatarUrl = null;
      if (req.file) {
        avatarUrl = `http://localhost:5000/uploads/${req.file.filename}`; // Full URL để frontend hiển thị
      }

      const pool = await poolPromise;
      await pool
        .request()
        .input("UserID", req.user.id)
        .input("AvatarURL", avatarUrl)
        .query(
          "UPDATE Users SET AvatarURL = @AvatarURL WHERE UserID = @UserID"
        );

      // Cập nhật Redux: Frontend sẽ refetch /api/profile để sync
      res.json({ avatar: avatarUrl, message: "Cập nhật avatar thành công" });
    } catch (err) {
      console.error("Profile upload error:", err);
      res.status(500).json({ message: "Lỗi khi upload avatar" });
    }
  }
);

// PUT /api/profile - Cập nhật thông tin khác (nếu cần, ví dụ Phone - nhưng yêu cầu chỉ avatar)
router.put("/", verifyToken, async (req, res) => {
  try {
    const { phone } = req.body; // Có thể mở rộng cho username/email nếu cần
    if (!phone) return res.status(400).json({ message: "Thiếu dữ liệu" });

    const pool = await poolPromise;
    await pool
      .request()
      .input("UserID", req.user.id)
      .input("Phone", phone.trim())
      .query("UPDATE Users SET Phone = @Phone WHERE UserID = @UserID");

    res.json({ message: "Cập nhật thành công", phone });
  } catch (err) {
    console.error("Profile PUT error:", err);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
});

module.exports = router;
