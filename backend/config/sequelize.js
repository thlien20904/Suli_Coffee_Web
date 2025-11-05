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

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 1433,
    dialect: "mssql",
    timezone: "+07:00", // Thêm để xử lý timezone local (Việt Nam)
    dialectOptions: {
      options: {
        encrypt: process.env.DB_ENCRYPT === "true",
        trustServerCertificate: true,
      },
    },
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
    console.error("❌ Lỗi kết nối SQL Server:", err);
  }
})();

module.exports = sequelize; // ✅ Quan trọng! Phải export instance này
