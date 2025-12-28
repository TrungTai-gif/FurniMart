const express = require("express");
const { body } = require("express-validator");
const deliveryController = require("../controllers/delivery.controller");
const {
  authenticateToken,
  requireRole,
  requireAnyRole,
} = require("../middleware/auth.middleware");
const upload = require("../middleware/upload.middleware");

const router = express.Router();

// ────────────────────────────────────────────────────────────────
// VALIDATION SCHEMAS
// ────────────────────────────────────────────────────────────────
const createDeliveryValidation = [
  body("orderId").notEmpty().withMessage("Order ID là bắt buộc").bail(),

  body("recipientName")
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage("Tên người nhận phải từ 2-255 ký tự")
    .bail(),

  body("recipientPhone")
    .trim()
    .matches(/^[0-9]{10,11}$/)
    .withMessage("Số điện thoại không hợp lệ (10-11 số)")
    .bail(),

  body("deliveryAddress")
    .trim()
    .isLength({ min: 5, max: 1000 })
    .withMessage("Địa chỉ giao hàng phải từ 5-1000 ký tự")
    .bail(),

  body("deliveryCity")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Tỉnh/Thành phố là bắt buộc")
    .bail(),

  body("deliveryDistrict")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Quận/Huyện là bắt buộc")
    .bail(),

  // Optional fields (nếu có mở rộng sau)
  body("deliveryWard").optional().trim().isLength({ max: 100 }),
  body("notes").optional().trim().isLength({ max: 500 }),
];

const updateStatusValidation = [
  body("newStatus")
    .isIn([
      "Pending",
      "Assigned",
      "InTransit",
      "Delivered",
      "Failed",
      "Cancelled",
      "Returned",
    ])
    .withMessage("Trạng thái giao hàng không hợp lệ")
    .bail(),

  body("notes").optional().trim().isLength({ max: 500 }),

  body("latitude")
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage("Latitude phải từ -90 đến 90"),

  body("longitude")
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage("Longitude phải từ -180 đến 180"),

  body("location").optional().isString().trim(),
];

const assignDeliveryValidation = [
  body("staffId")
    .notEmpty()
    .withMessage("Staff ID là bắt buộc")
    .isUUID()
    .withMessage("Staff ID phải là UUID hợp lệ")
    .bail(),
];

// ────────────────────────────────────────────────────────────────
// PUBLIC ROUTES (không cần đăng nhập - dùng cho map)
// ────────────────────────────────────────────────────────────────
router.get("/geocode", deliveryController.geocodeDeliveryAddress);
router.get("/route", deliveryController.calculateDeliveryRoute);
router.get("/reverse-geocode", deliveryController.reverseGeocodeLocation);

// ────────────────────────────────────────────────────────────────
// PROTECTED ROUTES - Yêu cầu đăng nhập
// ────────────────────────────────────────────────────────────────
router.use(authenticateToken); // Áp dụng cho tất cả route bên dưới

// Nhân viên giao hàng
router.get("/my-deliveries", deliveryController.getMyDeliveries);

// Quản lý (Admin hoặc BranchManager)
const adminOrManager = requireRole(["Admin", "BranchManager"]);

// Route quản lý
router.get("/", adminOrManager, deliveryController.getAllDeliveries);

router.get(
  "/staff/:staffId",
  adminOrManager,
  deliveryController.getDeliveriesByStaffId
);

router.post(
  "/",
  adminOrManager,
  createDeliveryValidation,
  deliveryController.createDelivery
);

router.post(
  "/:deliveryId/assign",
  adminOrManager,
  assignDeliveryValidation,
  deliveryController.assignDelivery
);

// Route chung (cả nhân viên và quản lý đều dùng được)
router.get("/:deliveryId", deliveryController.getDeliveryById);
router.get("/orders/:orderId", deliveryController.getDeliveriesByOrderId);
router.get("/:deliveryId/history", deliveryController.getStatusHistory);
router.get("/:deliveryId/proofs", deliveryController.getProofs); // Thêm route thiếu

// Nhân viên cập nhật trạng thái (controller sẽ check quyền sở hữu)
router.put(
  "/:deliveryId/status",
  updateStatusValidation,
  deliveryController.updateDeliveryStatus
);

// Quản lý bằng chứng giao hàng
router.post(
  "/:deliveryId/proof",
  requireRole(["DeliveryStaff"]), // Sửa: dùng array để middleware hoạt động đúng
  upload.single("file"),
  deliveryController.uploadProof
);

router.delete(
  "/:deliveryId/proof/:proofId",
  requireAnyRole(["DeliveryStaff", "Admin"]),
  deliveryController.deleteProof
);

module.exports = router;
