// server.js
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
require("dotenv").config();

const db = require("./config/database");
const deliveryRoutes = require("./routes/delivery.routes");

const app = express();
const PORT = process.env.PORT || 5005;

// ────────────────────────────────────────────────────────────────
// BASIC SECURITY & CONFIGURATION
// ────────────────────────────────────────────────────────────────

// Helmet - Bảo vệ header cơ bản (chống clickjacking, XSS, v.v.)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'"],
      },
    },
  })
);

// CORS - Chỉ cho phép origin được định nghĩa
const allowedOrigins = [
  process.env.CORS_ORIGIN || "http://localhost:3000", // frontend dev
  "http://localhost:5005",
  // Thêm domain production sau: "https://your-frontend.com"
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body parser
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Serve static files (uploads)
const UPLOAD_DIR =
  process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
app.use("/uploads", express.static(UPLOAD_DIR));

// Rate limiting cho tất cả API
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 phút
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // max 100 request
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau.",
  },
});
app.use("/api/", apiLimiter);

// ────────────────────────────────────────────────────────────────
// HEALTH CHECK & ROUTES
// ────────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    service: "delivery-service",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    env: process.env.NODE_ENV || "development",
  });
});

// API Routes
app.use("/api/deliveries", deliveryRoutes);

// ────────────────────────────────────────────────────────────────
// ERROR HANDLING & 404
// ────────────────────────────────────────────────────────────────

// 404 Not Found
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Không tìm thấy route",
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Lỗi server:", {
    message: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  // Xử lý lỗi Multer
  if (err instanceof require("multer").MulterError) {
    return res.status(400).json({
      success: false,
      message: err.message || "Lỗi upload file",
      code: err.code,
    });
  }

  // Xử lý lỗi validation hoặc custom
  const status = err.status || 500;
  const message =
    status === 500
      ? "Lỗi hệ thống nội bộ, vui lòng thử lại sau"
      : err.message || "Lỗi không xác định";

  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// ────────────────────────────────────────────────────────────────
// START SERVER & DB CONNECTION
// ────────────────────────────────────────────────────────────────
const startServer = async () => {
  try {
    await db.connect();
    console.log("✅ Kết nối database thành công");

    const server = app.listen(PORT, () => {
      console.log(`🚀 Delivery Service đang chạy tại port ${PORT}`);
      console.log(`Môi trường: ${process.env.NODE_ENV || "development"}`);
    });

    // Graceful shutdown
    const shutdown = async (signal) => {
      console.log(`${signal} received. Đóng server...`);
      server.close(() => {
        console.log("HTTP server đã đóng");
      });

      await db.close();
      console.log("Kết nối database đã đóng");
      process.exit(0);
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    console.error("❌ Không thể khởi động server:", error);
    process.exit(1);
  }
};

// Khởi động
startServer();

module.exports = app;
