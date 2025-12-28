const express = require("express");
const { body } = require("express-validator");
const InvoiceController = require("../controllers/invoice.controller");
const { authenticate, authorize } = require("../middleware/auth.middleware");

const router = express.Router();

// Validation rules
const updateInvoiceValidation = [
  body("status").optional().isIn(["UNPAID", "PAID", "OVERDUE", "CANCELLED"]).withMessage("Invalid status"),
  body("paidDate").optional().isISO8601().withMessage("Invalid paid date"),
  body("notes").optional().trim(),
];

// Routes
// Lấy tất cả invoices (chỉ ADMIN, BRANCH_MANAGER)
router.get("/", authenticate, authorize("ADMIN", "BRANCH_MANAGER"), InvoiceController.getAllInvoices);

// Lấy invoice theo ID
router.get("/:id", authenticate, authorize("ADMIN", "BRANCH_MANAGER"), InvoiceController.getInvoiceById);

// Lấy invoice theo order ID (hoặc tạo mới nếu chưa có)
router.get("/order/:orderId", authenticate, InvoiceController.getInvoiceByOrderId);

// Tạo invoice từ order (POST /invoices/generate/:orderId)
router.post("/generate/:id", authenticate, authorize("ADMIN", "BRANCH_MANAGER"), InvoiceController.generateInvoice);

// Cập nhật invoice
router.put("/:id", authenticate, authorize("ADMIN", "BRANCH_MANAGER"), updateInvoiceValidation, InvoiceController.updateInvoice);

// Xóa invoice (chỉ ADMIN)
router.delete("/:id", authenticate, authorize("ADMIN"), InvoiceController.deleteInvoice);

module.exports = router;
