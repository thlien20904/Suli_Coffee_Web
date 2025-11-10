const { Sequelize, DATE } = require("sequelize");
require("dotenv").config();

console.log("ENV:", {
  DB_NAME: process.env.DB_NAME,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_ENCRYPT: process.env.DB_ENCRYPT,
});

// Build connection options with safer defaults and support for named instances
const dbHost = process.env.DB_HOST || process.env.DB_SERVER || "localhost";
const dbPort = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 1433;
const dbInstance = process.env.DB_INSTANCE || null; // e.g. "SQLEXPRESS"

const dialectOptions = {
  options: {
    encrypt: process.env.DB_ENCRYPT === "true",
    trustServerCertificate: true,
    // Avoid Sequelize/tedious Operation timeout for complex queries
    requestTimeout: parseInt(process.env.DB_REQUEST_TIMEOUT) || 600000,
    connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT) || 300000,
  },
};

// If user provided a named instance (typical on Windows), instruct tedious to use it.
if (dbInstance) {
  // When instanceName is set, tedious negotiates dynamic port. Keep instanceName in options.
  dialectOptions.options.instanceName = dbInstance;
}

const sequelize = new Sequelize(
  process.env.DB_NAME || "",
  process.env.DB_USER || "",
  process.env.DB_PASSWORD || "",
  {
    host: dbHost,
    port: dbPort,
    dialect: "mssql",
    timezone: "+07:00",
    dialectOptions,
    logging: false,
  }
);

// ✅ Override _stringify cho DATE để fix lỗi format timezone với MSSQL
// Loại bỏ 'Z' hoặc '+00:00' khi stringify Date, MSSQL chỉ chấp nhận 'YYYY-MM-DD HH:mm:ss.SSS'
DATE.prototype._stringify = function _stringify(date, options) {
  date = this._applyTimezone(date, options);
  return date.format("YYYY-MM-DD HH:mm:ss.SSS"); // Không có timezone suffix
};

// ✅ Kiểm tra kết nối
(async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Kết nối SQL Server (Sequelize) thành công!");
  } catch (err) {
    console.error("❌ Lỗi kết nối SQL Server:", err && err.message ? err.message : err);
    console.error("→ DB host:", dbHost, "port:", dbPort, dbInstance ? `(instance: ${dbInstance})` : "");
    console.error("→ Kiểm tra: SQL Server service có đang chạy? Firewall/port? Nếu là named instance (SQLEXPRESS), set DB_INSTANCE=SOMENAME in .env");
  }
})();

module.exports = sequelize; // ✅ Quan trọng! Phải export instance này
