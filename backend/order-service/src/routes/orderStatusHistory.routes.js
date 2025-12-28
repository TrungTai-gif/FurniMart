const express = require("express");
const { body } = require("express-validator");
const OrderStatusHistoryController = require("../controllers/orderStatusHistory.controller");
const { authenticate, authorize } = require("../middleware/auth.middleware");

const router = express.Router();

// Validation rules
const createHistoryValidation = [
  body("orderId").notEmpty().withMessage("Order ID is required"),
  body("newStatus")
    .notEmpty()
    .withMessage("New status is required")
    .isIn(["PENDING", "CONFIRMED", "PROCESSING", "READY_TO_SHIP", "SHIPPING", "DELIVERED", "CANCELLED"])
    .withMessage("Invalid status"),
  body("oldStatus").optional().trim(),
  body("notes").optional().trim(),
];

// Routes
// Lấy tất cả history của một order
router.get("/order/:orderId/history", authenticate, OrderStatusHistoryController.getOrderStatusHistory);

// Lấy history record theo ID
router.get("/:id", authenticate, OrderStatusHistoryController.getHistoryById);

// Tạo history record mới (thủ công - thường không dùng vì tự động tạo khi update status)
router.post("/", authenticate, authorize("ADMIN", "BRANCH_MANAGER"), createHistoryValidation, OrderStatusHistoryController.createHistory);

module.exports = router;
