const express = require("express");
const { body } = require("express-validator");
const OrderController = require("../controllers/order.controller");
const { authenticate, authorize } = require("../middleware/auth.middleware");

const router = express.Router();

// Validation rules
const createOrderValidation = [
  body("customerName").trim().notEmpty().withMessage("Customer name is required"),
  body("customerEmail").trim().isEmail().withMessage("Valid email is required"),
  body("customerPhone").trim().notEmpty().withMessage("Customer phone is required"),
  body("shippingAddress").trim().notEmpty().withMessage("Shipping address is required"),
  body("shippingWard").trim().notEmpty().withMessage("Shipping ward is required"),
  body("shippingDistrict").trim().notEmpty().withMessage("Shipping district is required"),
  body("shippingCity").trim().notEmpty().withMessage("Shipping city is required"),
  body("items").isArray({ min: 1 }).withMessage("At least one item is required"),
  body("items.*.productId").notEmpty().withMessage("Product ID is required"),
  body("items.*.productName").trim().notEmpty().withMessage("Product name is required"),
  body("items.*.productSKU").trim().notEmpty().withMessage("Product SKU is required"),
  body("items.*.unitPrice").isFloat({ min: 0 }).withMessage("Unit price must be a positive number"),
  body("items.*.quantity").isInt({ min: 1 }).withMessage("Quantity must be at least 1"),
  body("shippingFee").optional().isFloat({ min: 0 }).withMessage("Shipping fee must be a positive number"),
  body("tax").optional().isFloat({ min: 0 }).withMessage("Tax must be a positive number"),
  body("discount").optional().isFloat({ min: 0 }).withMessage("Discount must be a positive number"),
  body("paymentMethod").optional().isIn(["COD", "CREDIT_CARD", "DEBIT_CARD", "BANK_TRANSFER", "E_WALLET"]).withMessage("Invalid payment method"),
];

const updateStatusValidation = [
  body("status")
    .notEmpty()
    .withMessage("Status is required")
    .isIn(["PENDING", "CONFIRMED", "PROCESSING", "READY_TO_SHIP", "SHIPPING", "DELIVERED", "CANCELLED"])
    .withMessage("Invalid status"),
  body("notes").optional().trim(),
];

const assignBranchValidation = [
  body("branchId").isInt({ min: 1 }).withMessage("Valid branch ID is required"),
];

const cancelOrderValidation = [
  body("reason").trim().notEmpty().withMessage("Cancellation reason is required"),
];

// Routes
// Lấy tất cả orders (với filters)
router.get("/", authenticate, OrderController.getAllOrders);

// Lấy order theo ID
router.get("/:id", authenticate, OrderController.getOrderById);

// Tạo order mới
router.post("/", authenticate, createOrderValidation, OrderController.createOrder);

// Cập nhật status của order
router.put("/:id/status", authenticate, authorize("ADMIN", "BRANCH_MANAGER", "SELLER"), updateStatusValidation, OrderController.updateOrderStatus);

// Hủy order
router.post("/:id/cancel", authenticate, cancelOrderValidation, OrderController.cancelOrder);

// Gán order cho branch
router.post("/:id/assign-branch", authenticate, authorize("ADMIN", "BRANCH_MANAGER"), assignBranchValidation, OrderController.assignOrderToBranch);

// Xóa order (chỉ ADMIN)
router.delete("/:id", authenticate, authorize("ADMIN"), OrderController.deleteOrder);

module.exports = router;
