const express = require("express");
const cors = require("cors");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const dotenv = require("dotenv");
const multer = require("multer");
const path = require("path");
const jwt = require("jsonwebtoken");
const { expressjwt } = require("express-jwt"); // v8.5.1
const sequelize = require("./config/sequelize");
const initModels = require("./models/init-models");
const models = initModels(sequelize);
const bcrypt = require("bcryptjs");
const { Users } = models;

dotenv.config();

const app = express();
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(passport.initialize());
app.use(express.urlencoded({ extended: true }));

// 📌 Phục vụ ảnh tĩnh (chỉ dùng một thư mục images/)
app.use("/images", express.static(path.join(__dirname, "../images"))); // Thư mục images/ trong backend/
app.use("/uploads", express.static(path.join(__dirname, "Uploads")));
app.use("/images", express.static(path.join(__dirname, "public/images")));

// 📌 Route cho trang thành công
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

    // Kiểm tra user tồn tại qua model Users
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
          // Tạo mới user với PasswordHash mặc định
          user = await Users.create({
            Username: username,
            Email: email,
            PasswordHash: await bcrypt.hash("google", 10),
            Role: "User",
            AvatarUrl: avatar,
          });
        } else {
          // Cập nhật thông tin user
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

/* ---------------- MULTER UPLOAD ---------------- */
const storage = multer.diskStorage({
  destination: (req, file, cb) =>
    cb(null, path.join(__dirname, "public/images")),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

/* ---------------- IMPORT ROUTERS ---------------- */
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

/* ---------------- USE ROUTERS ---------------- */
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

/* ---------------- CONNECT DB ---------------- */
const connectDB = async () => {
  try {
    await poolPromise;
    console.log("✅ Connected to SQL Server");
  } catch (err) {
    console.error("❌ Database connection failed:", err);
  }
};
connectDB();

/* ---------------- GOOGLE OAUTH ROUTES ---------------- */
app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
    prompt: "select_account",
  })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/", session: false }),
  (req, res) => {
    const token = jwt.sign(
      {
        id: req.user.Id, // Sử dụng Id thay vì UserID
        role: (req.user.Role || "user").toLowerCase(),
        username: req.user.Username,
        email: req.user.Email,
        avatar: req.user.AvatarUrl || null, // Sử dụng AvatarUrl thay vì AvatarURL
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.redirect(
      `http://localhost:3000/login?token=${token}&role=${(
        req.user.Role || "user"
      ).toLowerCase()}&avatar=${encodeURIComponent(req.user.AvatarUrl || "")}`
    );
  }
);

/* ---------------- API CURRENT USER ---------------- */
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

const passwordRouter = require("./routes/user/password");
app.use("/api/password", passwordRouter);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
});
