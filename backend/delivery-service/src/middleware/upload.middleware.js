const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;
require("dotenv").config();

// ────────────────────────────────────────────────────────────────
// CẤU HÌNH UPLOAD
// ────────────────────────────────────────────────────────────────
const UPLOAD_DIR =
  process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024; // 5MB mặc định
const ALLOWED_MIMETYPES = (
  process.env.ALLOWED_FILE_TYPES ||
  "image/jpeg,image/png,image/jpg,image/gif,application/pdf"
)
  .split(",")
  .map((t) => t.trim());

// Đảm bảo thư mục upload tồn tại (async)
const ensureUploadDir = async () => {
  try {
    await fs.access(UPLOAD_DIR);
  } catch {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    console.log(`Đã tạo thư mục upload: ${UPLOAD_DIR}`);
  }
};

// Khởi tạo thư mục ngay khi load module
ensureUploadDir().catch((err) => {
  console.error("Không thể tạo thư mục upload:", err);
  process.exit(1); // Dừng server nếu không tạo được thư mục (critical)
});

// ────────────────────────────────────────────────────────────────
// STORAGE CONFIG
// ────────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `delivery-proof-${uniqueSuffix}${ext}`;
    cb(null, filename);
  },
});

// ────────────────────────────────────────────────────────────────
// FILE FILTER - Kiểm tra loại file
// ────────────────────────────────────────────────────────────────
const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIMETYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error(
      `Loại file không được phép: ${file.mimetype}. ` +
        `Chỉ chấp nhận: ${ALLOWED_MIMETYPES.join(", ")}`
    );
    error.code = "LIMIT_FILE_TYPE";
    cb(error, false);
  }
};

// ────────────────────────────────────────────────────────────────
// MULTER INSTANCE
// ────────────────────────────────────────────────────────────────
const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter,
});

// Export trực tiếp instance multer
module.exports = upload;
