const sql = require("mssql");
require("dotenv").config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  server: process.env.DB_SERVER || process.env.DB_HOST, // ✅ Đọc từ DB_SERVER trước
  port: parseInt(process.env.DB_PORT) || 1433,
  options: {
    encrypt: process.env.DB_ENCRYPT === "true", // ✅ Dùng đúng kiểu boolean
    trustServerCertificate: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then((pool) => {
    console.log("✅ Kết nối SQL Server (mssql) thành công!");
    return pool;
  })
  .catch((err) => {
    console.error("❌ Kết nối database thất bại:", err);
  });

module.exports = {
  sql,
  poolPromise,
};
