const sql = require("mssql");
const dotenv = require("dotenv");

dotenv.config();

// Cấu hình kết nối SQL Server
const dbConfig = {
  user: process.env.DB_USER, // sa
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER, // localhost
  database: process.env.DB_NAME, 
  options: {
    encrypt: false, // Không cần encrypt cho localhost
    trustServerCertificate: true, // Cho local development
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

// Tạo connection pool
const poolPromise = new sql.ConnectionPool(dbConfig)
  .connect()
  .then((pool) => {
    console.log("Kết nối thành công tới SQL Server");
    return pool;
  })
  .catch((err) => {
    console.error("Kết nối database thất bại:", err);
    process.exit(1);
  });

module.exports = {
  sql,
  poolPromise,
};
