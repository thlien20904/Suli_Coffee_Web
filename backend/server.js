const express = require("express");
const cors = require("cors");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const dotenv = require("dotenv");
const multer = require("multer");
const path = require("path");
const jwt = require("jsonwebtoken");
const { poolPromise } = require("./db");
const { expressjwt } = require("express-jwt"); // v8.5.1
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

/* ---------------- MIDDLEWARE JWT ---------------- */
app.use(
  "/api/admin",
  expressjwt({ secret: process.env.JWT_SECRET, algorithms: ["HS256"] }),
  (err, req, res, next) => {
    if (err) {
      console.error("JWT Error:", err);
      return res.status(401).json({ errors: [{ msg: "Token không hợp lệ" }] });
    }
    console.log("JWT decoded:", req.auth);
    req.user = req.auth;
    next();
  }
);

/* ---------------- GOOGLE STRATEGY ---------------- */
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const pool = await poolPromise;
        const email = profile.emails[0].value;
        const username = profile.displayName;
        const avatar = profile.photos?.[0]?.value || null;

        let user = await pool
          .request()
          .input("Email", email)
          .query("SELECT * FROM Users WHERE Email = @Email");

        if (user.recordset.length === 0) {
          await pool
            .request()
            .input("Username", username)
            .input("Email", email)
            .input("Password", "google") // placeholder
            .input("AvatarURL", avatar)
            .query(
              "INSERT INTO Users (Username, Email, Password, Role, AvatarURL) VALUES (@Username, @Email, @Password, 'User', @AvatarURL)"
            );

          user = await pool
            .request()
            .input("Email", email)
            .query("SELECT * FROM Users WHERE Email = @Email");
        } else {
          await pool
            .request()
            .input("Email", email)
            .input("Username", username)
            .input("AvatarURL", avatar)
            .query(
              "UPDATE Users SET Username=@Username, AvatarURL=@AvatarURL WHERE Email=@Email"
            );
        }

        return done(null, user.recordset[0]);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

/* ---------------- MULTER UPLOAD ---------------- */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });
app.use("/uploads", express.static("uploads"));

/* ---------------- IMPORT ROUTERS ---------------- */
const authRouter = require("./routes/user/auth");
const profileRouter = require("./routes/user/profile");
const productsUserRouter = require("./routes/user/productsUser");
const cartUserRouter = require("./routes/user/cartUser");
const ordersUserRouter = require("./routes/user/ordersUser");
const blogsUserRouter = require("./routes/user/blogsUser");
const addressesUserRouter = require("./routes/user/addressesUser");
const homeRouter = require("./routes/user/homeUser");

const productsAdminRouter = require("./routes/admin/productsAdmin");
const usersAdminRouter = require("./routes/admin/usersAdmin");
const ordersAdminRouter = require("./routes/admin/ordersAdmin");
const blogsAdminRouter = require("./routes/admin/blogsAdmin");
const addressesAdminRouter = require("./routes/admin/addressesAdmin");
const homeAdminRouter = require("./routes/admin/homeAdmin"); // Đảm bảo import đúng
const authAdminRoutes = require("./routes/admin/authAdmin");
const categoriesRouter = require("./routes/shared/categories");
const couponsRouter = require("./routes/shared/coupons");

/* ---------------- USE ROUTERS ---------------- */
app.use("/api/auth", authRouter);
app.use("/api/profile", profileRouter);
app.use("/api/products", productsUserRouter);
app.use("/api/cart", cartUserRouter);
app.use("/api/orders", ordersUserRouter);
app.use("/api/blogs", blogsUserRouter);
app.use("/api/addresses", addressesUserRouter);
app.use("/api/home", homeRouter);

// Admin routes
app.use("/api/admin", homeAdminRouter); // Đảm bảo route này được sử dụng
app.use("/api/admin/products", productsAdminRouter);
app.use("/api/admin/users", usersAdminRouter);
app.use("/api/admin/orders", ordersAdminRouter);
app.use("/api/admin/blogs", blogsAdminRouter);
app.use("/api/admin/addresses", addressesAdminRouter);
app.use("/api/admin/auth", authAdminRoutes);

app.use("/api/categories", categoriesRouter);
app.use("/api/coupons", couponsRouter);

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
        id: req.user.UserID,
        role: (req.user.Role || "user").toLowerCase(), // ép chữ thường
        username: req.user.Username,
        email: req.user.Email,
        avatar: req.user.AvatarURL,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.redirect(
      `http://localhost:3000/login?token=${token}&role=${(
        req.user.Role || "user"
      ).toLowerCase()}&avatar=${encodeURIComponent(req.user.AvatarURL || "")}`
    );
  }
);

/* ---------------- API CURRENT USER ---------------- */
app.get("/api/current_user", (req, res) => {
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

/* ---------------- START SERVER ---------------- */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Backend running at http://localhost:${PORT}`)
);
