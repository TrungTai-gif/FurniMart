const express = require("express");
const { body } = require("express-validator");
const OrderItemController = require("../controllers/orderItem.controller");
const { authenticate, authorize } = require("../middleware/auth.middleware");

const router = express.Router();

// Validation rules
const createOrderItemValidation = [
  body("productId").notEmpty().withMessage("Product ID is required"),
  body("productName").trim().notEmpty().withMessage("Product name is required"),
  body("productSKU").trim().notEmpty().withMessage("Product SKU is required"),
  body("unitPrice").isFloat({ min: 0 }).withMessage("Unit price must be a positive number"),
  body("quantity").isInt({ min: 1 }).withMessage("Quantity must be at least 1"),
  body("productImage").optional().trim(),
  body("attributes").optional(),
];

// Routes
// Lấy tất cả items của một order
router.get("/order/:orderId/items", authenticate, OrderItemController.getOrderItems);

// Lấy item theo ID
router.get("/:id", authenticate, OrderItemController.getOrderItemById);

// Thêm item vào order (chỉ khi order đang PENDING)
router.post("/order/:orderId/items", authenticate, createOrderItemValidation, OrderItemController.addOrderItem);

// Xóa item khỏi order (chỉ khi order đang PENDING)
router.delete("/:id", authenticate, authorize("ADMIN", "BRANCH_MANAGER"), OrderItemController.deleteOrderItem);

module.exports = router;
