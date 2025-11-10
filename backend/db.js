const sql = require("mssql");
require("dotenv").config();

const dbServer = process.env.DB_SERVER || process.env.DB_HOST || "localhost";
const dbPort = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 1433;
const dbInstance = process.env.DB_INSTANCE || null; // e.g. SQLEXPRESS

const options = {
  encrypt: process.env.DB_ENCRYPT === "true",
  trustServerCertificate: true,
};
if (dbInstance) {
  // For named instances on Windows, mssql/tedious uses instanceName instead of static port
  options.instanceName = dbInstance;
}

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  server: dbServer,
  port: dbPort,
  options,
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

// Timeouts: increase request/connection timeouts to avoid Operation timeout on heavy queries
// You can override via environment variables DB_REQUEST_TIMEOUT and DB_CONNECTION_TIMEOUT (milliseconds)
config.requestTimeout = parseInt(process.env.DB_REQUEST_TIMEOUT) || 600000; // 10 minutes
config.connectionTimeout = parseInt(process.env.DB_CONNECTION_TIMEOUT) || 300000; // 5 minutes

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then((pool) => {
    console.log("✅ Kết nối SQL Server (mssql) thành công!");
    return pool;
  })
  .catch((err) => {
    console.error("❌ Kết nối database thất bại:", err && err.message ? err.message : err);
    console.error("→ DB server:", dbServer, "port:", dbPort, dbInstance ? `(instance: ${dbInstance})` : "");
    console.error("→ Nếu bạn đang chạy SQL Server cục bộ: kiểm tra service 'SQL Server' hoặc 'MSSQL$<instance>' và firewall, và đảm bảo port đúng.");
  });

module.exports = {
  sql,
  poolPromise,
};
