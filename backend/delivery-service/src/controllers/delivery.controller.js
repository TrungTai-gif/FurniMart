// controllers/delivery.controller.js
const { validationResult } = require("express-validator");
const DeliveryOrder = require("../models/delivery_order.model");
const DeliveryProof = require("../models/delivery_proof.model");
const path = require("path");
const fs = require("fs").promises; // Sử dụng promises để dễ async hơn
const tomtomUtils = require("../utils/tomtom.utils");

// Helper: Kiểm tra quyền DeliveryStaff chỉ xử lý đơn của mình
const checkStaffOwnership = (delivery, user) => {
  if (
    user?.roles?.includes("DeliveryStaff") &&
    delivery?.DeliveryStaffId?.toString() !== user?.userId?.toString()
  ) {
    throw new Error(
      "Access denied: Bạn không phải nhân viên được giao đơn này"
    );
  }
};

// Helper: Xóa file an toàn
const safeUnlink = async (filePath) => {
  try {
    if (
      await fs
        .access(filePath)
        .then(() => true)
        .catch(() => false)
    ) {
      await fs.unlink(filePath);
    }
  } catch (err) {
    console.warn("Không thể xóa file:", err.message);
  }
};

// ────────────────────────────────────────────────────────────────
// Deliveries - Lấy danh sách đơn giao hàng
// ────────────────────────────────────────────────────────────────

/**
 * Lấy tất cả đơn giao hàng (chỉ Admin/BranchManager)
 * DeliveryStaff sẽ bị giới hạn ở /my-deliveries
 */
const getAllDeliveries = async (req, res, next) => {
  try {
    // Chỉ Admin/BranchManager mới xem được tất cả
    if (!req.user?.roles?.some((r) => ["Admin", "BranchManager"].includes(r))) {
      return res.status(403).json({
        success: false,
        message: "Chỉ Admin hoặc BranchManager mới xem được tất cả đơn hàng",
      });
    }

    const filters = {
      status: req.query.status,
      branchId: req.query.branchId,
      staffId: req.query.staffId,
      page: req.query.page ? parseInt(req.query.page) : 1,
      limit: req.query.limit ? parseInt(req.query.limit) : 20,
    };

    const deliveries = await DeliveryOrder.getAll(filters);
    res.json({
      success: true,
      data: deliveries,
      count: deliveries.length,
      page: filters.page,
      limit: filters.limit,
    });
  } catch (error) {
    console.error("Lỗi lấy tất cả đơn:", error);
    next(error);
  }
};

/**
 * Lấy chi tiết 1 đơn giao hàng
 */
const getDeliveryById = async (req, res, next) => {
  try {
    const { deliveryId } = req.params;
    const delivery = await DeliveryOrder.getById(deliveryId);

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn giao hàng",
      });
    }

    // DeliveryStaff chỉ xem đơn của mình
    checkStaffOwnership(delivery, req.user);

    // Load proofs
    delivery.proofs = await DeliveryProof.getByDeliveryId(deliveryId);

    res.json({ success: true, data: delivery });
  } catch (error) {
    if (error.message.includes("Access denied")) {
      return res.status(403).json({ success: false, message: error.message });
    }
    console.error("Lỗi lấy chi tiết đơn:", error);
    next(error);
  }
};

/**
 * Lấy các đơn giao hàng theo orderId (có thể public hoặc protected tùy logic business)
 */
const getDeliveriesByOrderId = async (req, res, next) => {
  try {
    const deliveries = await DeliveryOrder.getByOrderId(req.params.orderId);
    res.json({
      success: true,
      data: deliveries,
      count: deliveries.length,
    });
  } catch (error) {
    console.error("Lỗi lấy đơn theo orderId:", error);
    next(error);
  }
};

/**
 * Lấy danh sách đơn của chính nhân viên đang đăng nhập
 */
const getMyDeliveries = async (req, res, next) => {
  try {
    const filters = {
      status: req.query.status,
      page: req.query.page ? parseInt(req.query.page) : 1,
      limit: req.query.limit ? parseInt(req.query.limit) : 20,
    };

    const deliveries = await DeliveryOrder.getByStaffId(
      req.user.userId,
      filters
    );

    res.json({
      success: true,
      data: deliveries,
      count: deliveries.length,
      page: filters.page,
      limit: filters.limit,
    });
  } catch (error) {
    console.error("Lỗi lấy đơn của tôi:", error);
    next(error);
  }
};

/**
 * Admin/BranchManager xem đơn của một nhân viên cụ thể
 */
const getDeliveriesByStaffId = async (req, res, next) => {
  try {
    if (!req.user?.roles?.some((r) => ["Admin", "BranchManager"].includes(r))) {
      return res
        .status(403)
        .json({ success: false, message: "Không có quyền" });
    }

    const { staffId } = req.params;
    const filters = {
      status: req.query.status,
      page: req.query.page ? parseInt(req.query.page) : 1,
      limit: req.query.limit ? parseInt(req.query.limit) : 20,
    };

    const deliveries = await DeliveryOrder.getByStaffId(staffId, filters);

    res.json({
      success: true,
      data: deliveries,
      count: deliveries.length,
    });
  } catch (error) {
    console.error("Lỗi lấy đơn theo staffId:", error);
    next(error);
  }
};

// ────────────────────────────────────────────────────────────────
// Quản lý đơn giao hàng
// ────────────────────────────────────────────────────────────────

const createDelivery = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
        errors: errors.array(),
      });
    }

    const delivery = await DeliveryOrder.create(req.body);
    res.status(201).json({
      success: true,
      message: "Tạo đơn giao hàng thành công",
      data: delivery,
    });
  } catch (error) {
    console.error("Lỗi tạo đơn:", error);
    next(error);
  }
};

const assignDelivery = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
        errors: errors.array(),
      });
    }

    const { deliveryId } = req.params;
    const { staffId } = req.body;

    const delivery = await DeliveryOrder.assign(
      deliveryId,
      staffId,
      req.user.userId
    );

    res.json({
      success: true,
      message: "Giao đơn cho nhân viên thành công",
      data: delivery,
    });
  } catch (error) {
    console.error("Lỗi giao đơn:", error);
    next(error);
  }
};

const updateDeliveryStatus = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
        errors: errors.array(),
      });
    }

    const { deliveryId } = req.params;
    const { newStatus, notes, location, latitude, longitude } = req.body;

    const delivery = await DeliveryOrder.getById(deliveryId);
    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn giao hàng",
      });
    }

    // Kiểm tra quyền
    checkStaffOwnership(delivery, req.user);

    const changedByType = req.user?.roles?.some((r) =>
      ["Admin", "BranchManager", "DeliveryStaff"].includes(r)
    )
      ? "Staff"
      : "System";

    const updatedDelivery = await DeliveryOrder.updateStatus(
      deliveryId,
      newStatus,
      req.user.userId,
      changedByType,
      notes,
      location,
      latitude ? parseFloat(latitude) : null,
      longitude ? parseFloat(longitude) : null
    );

    res.json({
      success: true,
      message: "Cập nhật trạng thái thành công",
      data: updatedDelivery,
    });
  } catch (error) {
    if (error.message.includes("Access denied")) {
      return res.status(403).json({ success: false, message: error.message });
    }
    console.error("Lỗi cập nhật trạng thái:", error);
    next(error);
  }
};

// ────────────────────────────────────────────────────────────────
// Quản lý bằng chứng giao hàng (Proof)
// ────────────────────────────────────────────────────────────────

const uploadProof = async (req, res, next) => {
  try {
    const { deliveryId } = req.params;
    const { proofType, description } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng upload file",
      });
    }

    const delivery = await DeliveryOrder.getById(deliveryId);
    if (!delivery) {
      await safeUnlink(req.file.path);
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn giao hàng",
      });
    }

    checkStaffOwnership(delivery, req.user);

    const fileUrl = `/uploads/${req.file.filename}`;

    const proofData = {
      deliveryId,
      proofType: proofType || "Photo",
      fileUrl,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      description: description || null,
      uploadedBy: req.user.userId,
    };

    const proof = await DeliveryProof.create(proofData);

    res.status(201).json({
      success: true,
      message: "Upload bằng chứng thành công",
      data: proof,
    });
  } catch (error) {
    if (req.file?.path) await safeUnlink(req.file.path);
    console.error("Lỗi upload proof:", error);
    next(error);
  }
};

const getProofs = async (req, res, next) => {
  try {
    const { deliveryId } = req.params;
    const proofs = req.query.proofType
      ? await DeliveryProof.getByType(deliveryId, req.query.proofType)
      : await DeliveryProof.getByDeliveryId(deliveryId);

    res.json({
      success: true,
      data: proofs,
      count: proofs.length,
    });
  } catch (error) {
    console.error("Lỗi lấy proofs:", error);
    next(error);
  }
};

const deleteProof = async (req, res, next) => {
  try {
    const { proofId } = req.params;
    const proof = await DeliveryProof.getById(proofId);

    if (!proof) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bằng chứng",
      });
    }

    // Chỉ người upload hoặc Admin được xóa
    if (
      req.user?.roles?.includes("DeliveryStaff") &&
      proof.UploadedBy?.toString() !== req.user.userId?.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xóa bằng chứng này",
      });
    }

    // Xóa file vật lý
    const filePath = path.join(
      process.env.UPLOAD_DIR || "./uploads",
      path.basename(proof.FileUrl)
    );
    await safeUnlink(filePath);

    await DeliveryProof.delete(proofId);

    res.json({
      success: true,
      message: "Xóa bằng chứng thành công",
    });
  } catch (error) {
    console.error("Lỗi xóa proof:", error);
    next(error);
  }
};

// ────────────────────────────────────────────────────────────────
// Lịch sử trạng thái
// ────────────────────────────────────────────────────────────────
const getStatusHistory = async (req, res, next) => {
  try {
    const history = await DeliveryOrder.getStatusHistory(req.params.deliveryId);
    res.json({
      success: true,
      data: history,
      count: history.length,
    });
  } catch (error) {
    console.error("Lỗi lấy lịch sử trạng thái:", error);
    next(error);
  }
};

// ────────────────────────────────────────────────────────────────
// Tích hợp TomTom Maps
// ────────────────────────────────────────────────────────────────

const geocodeDeliveryAddress = async (req, res, next) => {
  try {
    const { address } = req.query;
    if (!address) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp địa chỉ",
      });
    }

    const geocoded = await tomtomUtils.geocodeAddress(address);
    res.json({ success: true, data: geocoded });
  } catch (error) {
    console.error("Lỗi geocode:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Không thể tìm địa chỉ",
    });
  }
};

const calculateDeliveryRoute = async (req, res, next) => {
  try {
    const { startLat, startLon, endLat, endLon, travelMode } = req.query;

    if (!startLat || !startLon || !endLat || !endLon) {
      return res.status(400).json({
        success: false,
        message: "Cần đầy đủ tọa độ điểm đầu và điểm cuối",
      });
    }

    const route = await tomtomUtils.calculateRoute(
      parseFloat(startLat),
      parseFloat(startLon),
      parseFloat(endLat),
      parseFloat(endLon),
      travelMode || "car"
    );

    res.json({ success: true, data: route });
  } catch (error) {
    console.error("Lỗi tính lộ trình:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Không thể tính lộ trình",
    });
  }
};

const reverseGeocodeLocation = async (req, res, next) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        message: "Cần cung cấp latitude và longitude",
      });
    }

    const address = await tomtomUtils.reverseGeocode(
      parseFloat(lat),
      parseFloat(lon)
    );

    res.json({ success: true, data: address });
  } catch (error) {
    console.error("Lỗi reverse geocode:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Không thể tìm địa chỉ từ tọa độ",
    });
  }
};

module.exports = {
  getAllDeliveries,
  getDeliveryById,
  getDeliveriesByOrderId,
  getMyDeliveries,
  getDeliveriesByStaffId,
  createDelivery,
  assignDelivery,
  updateDeliveryStatus,
  uploadProof,
  getProofs,
  deleteProof,
  getStatusHistory,
  geocodeDeliveryAddress,
  calculateDeliveryRoute,
  reverseGeocodeLocation,
};
