const sql = require("mssql");
require("dotenv").config();

let pool = null;

const config = {
  user: process.env.SQL_SERVER_USER || "sa",
  password: process.env.SQL_SERVER_PASSWORD || "123456aA@$",
  server: process.env.SQL_SERVER_HOST || "localhost", // ❗ sửa chỗ này
  port: Number(process.env.SQL_SERVER_PORT || 1433),
  database: "delivery_db",
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};
const connect = async () => {
  try {
    if (!pool) {
      pool = await sql.connect(config);
      console.log("Connected to SQL Server - Delivery Database");
    }
    return pool;
  } catch (error) {
    console.error("SQL Server connection error:", error);
    throw error;
  }
};

const getPool = () => {
  if (!pool) {
    throw new Error("Database pool not initialized. Call connect() first.");
  }
  return pool;
};

const close = async () => {
  try {
    if (pool) {
      await pool.close();
      pool = null;
      console.log("Database connection closed");
    }
  } catch (error) {
    console.error("Error closing database connection:", error);
    throw error;
  }
};

module.exports = {
  connect,
  getPool,
  close,
  sql,
};
