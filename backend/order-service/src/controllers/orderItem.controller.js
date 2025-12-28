const OrderItemModel = require("../models/orderItem.model");
const OrderModel = require("../models/order.model");
const { validationResult } = require("express-validator");

class OrderItemController {
  /**
   * Lấy tất cả items của một order
   */
  static async getOrderItems(req, res, next) {
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
          message: "You don't have permission to view this order's items",
        });
      }

      const items = await OrderItemModel.findByOrderId(orderId);

      res.json({
        success: true,
        data: { items },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lấy item theo ID
   */
  static async getOrderItemById(req, res, next) {
    try {
      const { id } = req.params;

      const item = await OrderItemModel.findById(id);

      if (!item) {
        return res.status(404).json({
          success: false,
          message: "Order item not found",
        });
      }

      res.json({
        success: true,
        data: { item },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Thêm item vào order
   */
  static async addOrderItem(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { orderId } = req.params;
      const itemData = req.body;

      // Kiểm tra order có tồn tại không
      const order = await OrderModel.findById(orderId);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      // Chỉ cho phép thêm item nếu order đang ở status PENDING
      if (order.Status !== "PENDING") {
        return res.status(400).json({
          success: false,
          message: "Cannot add items to order that is not in PENDING status",
        });
      }

      // Tạo item
      const newItem = await OrderItemModel.create({
        orderId: orderId,
        ...itemData,
        subTotal: itemData.unitPrice * itemData.quantity,
      });

      // Cập nhật tổng tiền của order
      const items = await OrderItemModel.findByOrderId(orderId);
      const newSubTotal = items.reduce((sum, item) => sum + parseFloat(item.SubTotal), 0);
      const newTotalAmount = newSubTotal + parseFloat(order.ShippingFee) + parseFloat(order.Tax) - parseFloat(order.Discount);

      await OrderModel.update(orderId, {
        // Note: Cần thêm subTotal và totalAmount vào allowedFields trong order.model.js
      });

      res.status(201).json({
        success: true,
        message: "Order item added successfully",
        data: { item: newItem },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Xóa item khỏi order
   */
  static async deleteOrderItem(req, res, next) {
    try {
      const { id } = req.params;

      const item = await OrderItemModel.findById(id);

      if (!item) {
        return res.status(404).json({
          success: false,
          message: "Order item not found",
        });
      }

      // Kiểm tra order status
      const order = await OrderModel.findById(item.OrderId);
      if (order.Status !== "PENDING") {
        return res.status(400).json({
          success: false,
          message: "Cannot delete items from order that is not in PENDING status",
        });
      }

      await OrderItemModel.delete(id);

      // Cập nhật tổng tiền của order
      const items = await OrderItemModel.findByOrderId(item.OrderId);
      const newSubTotal = items.reduce((sum, it) => sum + parseFloat(it.SubTotal), 0);
      const newTotalAmount = newSubTotal + parseFloat(order.ShippingFee) + parseFloat(order.Tax) - parseFloat(order.Discount);

      res.json({
        success: true,
        message: "Order item deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = OrderItemController;
