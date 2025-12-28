const InvoiceModel = require("../models/invoice.model");
const OrderModel = require("../models/order.model");
const OrderItemModel = require("../models/orderItem.model");
const { validationResult } = require("express-validator");

class InvoiceController {
  /**
   * Lấy tất cả invoices với filters và phân trang
   */
  static async getAllInvoices(req, res, next) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        search,
        fromDate,
        toDate,
        sortBy = "IssuedDate",
        sortOrder = "DESC",
      } = req.query;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy,
        sortOrder: sortOrder.toUpperCase(),
      };

      if (status) options.status = status;
      if (search) options.search = search;
      if (fromDate) options.fromDate = new Date(fromDate);
      if (toDate) options.toDate = new Date(toDate);

      const invoices = await InvoiceModel.findAll(options);
      const total = await InvoiceModel.count(options);

      res.json({
        success: true,
        data: {
          invoices,
          pagination: {
            page: options.page,
            limit: options.limit,
            total,
            totalPages: Math.ceil(total / options.limit),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lấy invoice theo ID
   */
  static async getInvoiceById(req, res, next) {
    try {
      const { id } = req.params;

      const invoice = await InvoiceModel.findById(id);

      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: "Invoice not found",
        });
      }

      // Lấy thêm thông tin order và items
      const order = await OrderModel.findById(invoice.OrderId);
      const items = await OrderItemModel.findByOrderId(invoice.OrderId);

      res.json({
        success: true,
        data: {
          invoice: {
            ...invoice,
            order,
            items,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Tạo invoice từ order
   */
  static async generateInvoice(req, res, next) {
    try {
      const { id: orderId } = req.params;

      // Kiểm tra xem order có tồn tại không
      const order = await OrderModel.findById(orderId);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      // Kiểm tra xem invoice đã tồn tại chưa
      const existingInvoice = await InvoiceModel.findByOrderId(orderId);

      if (existingInvoice) {
        return res.status(400).json({
          success: false,
          message: "Invoice already exists for this order",
          data: { invoice: existingInvoice },
        });
      }

      // Tạo invoice
      const invoice = await InvoiceModel.createFromOrder(order);

      res.status(201).json({
        success: true,
        message: "Invoice generated successfully",
        data: { invoice },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lấy invoice theo order ID
   */
  static async getInvoiceByOrderId(req, res, next) {
    try {
      const { orderId } = req.params;

      const invoice = await InvoiceModel.findByOrderId(orderId);

      if (!invoice) {
        // Nếu chưa có invoice, tự động tạo
        const order = await OrderModel.findById(orderId);

        if (!order) {
          return res.status(404).json({
            success: false,
            message: "Order not found",
          });
        }

        const newInvoice = await InvoiceModel.createFromOrder(order);
        const items = await OrderItemModel.findByOrderId(orderId);

        return res.json({
          success: true,
          data: {
            invoice: {
              ...newInvoice,
              order,
              items,
            },
          },
        });
      }

      // Lấy thêm thông tin order và items
      const order = await OrderModel.findById(invoice.OrderId);
      const items = await OrderItemModel.findByOrderId(invoice.OrderId);

      res.json({
        success: true,
        data: {
          invoice: {
            ...invoice,
            order,
            items,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cập nhật invoice
   */
  static async updateInvoice(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { id } = req.params;
      const updateData = req.body;

      const invoice = await InvoiceModel.findById(id);

      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: "Invoice not found",
        });
      }

      const updatedInvoice = await InvoiceModel.update(id, updateData);

      res.json({
        success: true,
        message: "Invoice updated successfully",
        data: { invoice: updatedInvoice },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Xóa invoice (chỉ ADMIN)
   */
  static async deleteInvoice(req, res, next) {
    try {
      const { id } = req.params;

      const invoice = await InvoiceModel.findById(id);

      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: "Invoice not found",
        });
      }

      await InvoiceModel.delete(id);

      res.json({
        success: true,
        message: "Invoice deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = InvoiceController;
