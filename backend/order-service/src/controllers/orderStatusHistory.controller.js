const OrderStatusHistoryModel = require("../models/orderStatusHistory.model");
const OrderModel = require("../models/order.model");
const { validationResult } = require("express-validator");

class OrderStatusHistoryController {
  /**
   * Lấy tất cả history của một order
   */
  static async getOrderStatusHistory(req, res, next) {
    try {
      const { orderId } = req.params;

      // Kiểm tra order có tồn tại không
      const order = await OrderModel.findById(orderId);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      // Kiểm tra quyền truy cập
      if (
        req.user.roleName !== "ADMIN" &&
        req.user.roleName !== "BRANCH_MANAGER" &&
        order.UserId.toString().toUpperCase() !== req.user.id.toUpperCase()
      ) {
        return res.status(403).json({
          success: false,
          message: "You don't have permission to view this order's history",
        });
      }

      const history = await OrderStatusHistoryModel.findByOrderId(orderId);

      res.json({
        success: true,
        data: { history },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lấy history record theo ID
   */
  static async getHistoryById(req, res, next) {
    try {
      const { id } = req.params;

      const history = await OrderStatusHistoryModel.findById(id);

      if (!history) {
        return res.status(404).json({
          success: false,
          message: "History record not found",
        });
      }

      res.json({
        success: true,
        data: { history },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Tạo history record mới (thủ công)
   * Lưu ý: Thường history được tạo tự động khi update status
   */
  static async createHistory(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const historyData = {
        ...req.body,
        changedByUserId: req.user.id,
        changedByUserName: req.user.fullName,
      };

      const history = await OrderStatusHistoryModel.create(historyData);

      res.status(201).json({
        success: true,
        message: "History record created successfully",
        data: { history },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = OrderStatusHistoryController;
