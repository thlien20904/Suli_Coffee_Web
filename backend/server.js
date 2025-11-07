// server.js (đã chỉnh sửa)
const express = require("express");
const cors = require("cors");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const dotenv = require("dotenv");
const multer = require("multer");
const path = require("path");
const jwt = require("jsonwebtoken");
const { expressjwt } = require("express-jwt"); // v8.5.1 (nếu dùng)
const sequelize = require("./config/sequelize");
const initModels = require("./models/init-models");
const bcrypt = require("bcryptjs");
const { poolPromise } = require("./db"); // import poolPromise
const fs = require("fs").promises;
const crypto = require("crypto");
const helmet = require("helmet");

dotenv.config();

const app = express();

/* ---------------- MIDDLEWARE CƠ BẢN ---------------- */
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

/* ---------------- STATIC IMAGE ROUTES (chỉ 1 mount cho images) ---------------- */
/*
  Quy ước:
   -  /images/old/...  -> ảnh cũ (nếu bạn cần giữ folder ../images)
   -  /images/new/...  -> ảnh upload mới (public/images)
   -  /uploads/...     -> ảnh mặc định / tạm
*/
app.use(
  "/images/old",
  (req, res, next) => {
    // cho phép cross-origin load ảnh nếu cần
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  },
  express.static(path.join(__dirname, "../images"))
);

app.use(
  "/images/new",
  (req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  },
  express.static(path.join(__dirname, "public/images"))
);

// 📌 Phục vụ ảnh tĩnh (chỉ dùng một thư mục images/)
app.use("/images", express.static(path.join(__dirname, "../images"))); // Thư mục images/ trong backend/
app.use("/uploads", express.static(path.join(__dirname, "Uploads")));
app.use("/images", express.static(path.join(__dirname, "public/images")));

/* ---------------- SECURITY (helmet) — chỉ các header chung, KHÔNG set CSP toàn cục ở đây ---------------- */
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    crossOriginEmbedderPolicy: false,
    // Không đặt contentSecurityPolicy ở đây để tránh xung đột với nonce-inject per-request
  })
);

/* ---------------- MULTER UPLOAD ---------------- */
const storage = multer.diskStorage({
  destination: (req, file, cb) =>
    cb(null, path.join(__dirname, "public/images")),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

/* ---------------- INIT MODELS (Sequelize) ---------------- */
const models = initModels(sequelize);
const { Users } = models;

/* ---------------- IMPORT ROUTERS (GIỮ NGUYÊN NHƯ BẠN CÓ) ---------------- */
const authRouter = require("./routes/user/auth");
const profileRouter = require("./routes/user/profile");
const productsUserRouter = require("./routes/user/productsUser");
const cartUserRouter = require("./routes/user/cartUser");
const ordersUserRouter = require("./routes/user/ordersUser");
const StoresUserRouter = require("./routes/user/StoresUser");
const addressesUserRouter = require("./routes/user/addressesUser");
const homeRouter = require("./routes/user/homeUser");

const FoodRouter = require("./routes/admin/Food");
const homeAdminRouter = require("./routes/admin/homeAdmin");
const authAdminRoutes = require("./routes/admin/authAdmin");
const ingredientRouter = require("./routes/admin/ingredient");
const categoryRouter = require("./routes/admin/category");
const exportRouter = require("./routes/admin/export");
const paymentRouter = require("./routes/admin/payment");
const userRouter = require("./routes/admin/users");
const staffRouter = require("./routes/admin/staff");
const roleRouter = require("./routes/admin/role");
const invoiceRouter = require("./routes/admin/invoice");
const orderAdminRouter = require("./routes/admin/order");
const reportRouter = require("./routes/admin/report");
const voucherRouter = require("./routes/admin/voucher");

/* ---------------- USE ROUTERS (API) - đặt TRƯỚC route serve frontend build ---------------- */
app.use("/api/auth", authRouter);
app.use("/api/profile", profileRouter);
app.use("/api/products", productsUserRouter);
app.use("/api/cart", cartUserRouter);
app.use("/api/orders", ordersUserRouter);
app.use("/api/Stores", StoresUserRouter);
app.use("/api/addresses", addressesUserRouter);
app.use("/api/home", homeRouter);

// Admin routes
app.use("/api/admin/home", homeAdminRouter);
app.use("/api/admin/foods", FoodRouter);
app.use("/api/admin/auth", authAdminRoutes);
app.use("/api/admin/ingredients", ingredientRouter);
app.use("/api/admin/categories", categoryRouter);
app.use("/api/admin/export", exportRouter);
app.use("/api/admin/payment", paymentRouter);
app.use("/api/admin/users", userRouter);
app.use("/api/admin/staff", staffRouter);
app.use("/api/admin/roles", roleRouter);
app.use("/api/admin/invoice", invoiceRouter);
app.use("/api/admin/orders", orderAdminRouter);
app.use("/api/admin/report", reportRouter);
app.use("/api/admin/voucher", voucherRouter);

/* ---------------- Route thành công (giữ nguyên) ---------------- */
app.get("/successful", async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ success: false, message: "Không có token xác thực!" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "dev_secret_fallback"
    );

    const user = await Users.findOne({ where: { Id: decoded.id } });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy người dùng!" });
    }

    res.json({ success: true, message: "Đặt hàng thành công!" });
  } catch (err) {
    console.error("SUCCESS ROUTE ERROR:", err);
    return res
      .status(401)
      .json({ success: false, message: "Token hết hạn hoặc không hợp lệ!" });
  }
});

/* ---------------- GOOGLE OAUTH (giữ nguyên) ---------------- */
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const username = profile.displayName;
        const avatar = profile.photos?.[0]?.value || null;

        let user = await Users.findOne({ where: { Email: email } });

        if (!user) {
          user = await Users.create({
            Username: username,
            Email: email,
            PasswordHash: await bcrypt.hash("google", 10),
            Role: "User",
            AvatarUrl: avatar,
          });
        } else {
          await Users.update(
            { Username: username, AvatarUrl: avatar },
            { where: { Email: email } }
          );
          user = await Users.findOne({ where: { Email: email } });
        }

        return done(null, user.toJSON());
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

/* ---------------- Multer upload route example (nếu bạn có route upload) ---------------- */
/* Ví dụ: app.post("/api/upload", upload.single("file"), (req,res)=>{...}) 
   (bạn giữ hoặc đã có router riêng xử lý)
*/

/* ---------------- CONNECT DB (mssql pool) ---------------- */
const connectDB = async () => {
  try {
    await poolPromise;
    console.log("✅ Connected to SQL Server (mssql)");
  } catch (err) {
    console.error("❌ Database connection failed:", err);
  }
};
connectDB();

/* ---------------- API current_user (giữ nguyên) ---------------- */
app.get("/api/current_user", async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader) return res.json(null);

    const token = authHeader.split(" ")[1];
    if (!token) return res.json(null);

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) return res.json(null);

      const pool = await poolPromise;
      const user = await pool
        .request()
        .input("UserID", decoded.id)
        .query(
          "SELECT UserID, Username, Email, Role, AvatarURL FROM Users WHERE UserID = @UserID"
        );
      if (user.recordset.length === 0) return res.json(null);
      res.json({
        ...user.recordset[0],
        role: (user.recordset[0].Role || "user").toLowerCase(),
        avatar: decoded.avatar || null,
      });
    });
  } catch (err) {
    res.json(null);
  }
});

/* ---------------- Serve frontend build static assets (JS/CSS) ---------------- */
const frontendBuildPath = path.join(__dirname, "../frontend/build");
app.use(express.static(frontendBuildPath));

/* ---------------- CSP + Nonce injection for index.html (catch-all) ---------------- */
/* IMPORTANT: đặt SAU các route API. Sử dụng '/*' để tránh lỗi path-to-regexp. */
app.get(/^(?!\/api).*$/, async (req, res, next) => {
  try {
    // tạo nonce (base64)
    const nonce = crypto.randomBytes(16).toString("base64");

    // header CSP
    const csp = [
      "default-src 'self'",
      `script-src 'self' 'nonce-${nonce}'`,
      "style-src 'self' https: 'unsafe-inline'",
      "img-src 'self' data: blob: http://localhost:5000",
      "connect-src 'self' http://localhost:5000",
      "font-src 'self' https: data:",
      "object-src 'none'",
      "frame-ancestors 'self'",
      "base-uri 'self'",
    ].join("; ");
    res.setHeader("Content-Security-Policy", csp);

    // đọc index.html từ build và replace __NONCE__
    const indexPath = path.join(frontendBuildPath, "index.html");
    let indexHtml = await fs.readFile(indexPath, "utf8");
    indexHtml = indexHtml.replace(/__NONCE__/g, nonce);

    res.status(200).send(indexHtml);
  } catch (err) {
    next(err);
  }
});

/* ---------------- password router và các route khác (nếu có) ---------------- */
const passwordRouter = require("./routes/user/password");
app.use("/api/password", passwordRouter);

/* ---------------- START SERVER ---------------- */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
});
