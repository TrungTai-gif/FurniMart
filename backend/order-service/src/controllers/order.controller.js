const OrderModel = require("../models/order.model");
const OrderItemModel = require("../models/orderItem.model");
const OrderStatusHistoryModel = require("../models/orderStatusHistory.model");
const { validationResult } = require("express-validator");
const { geocodeAddress } = require("../utils/googleMaps.utils");
const { 
  findBranchesWithStock, 
  reserveStock,
  getActiveBranchesWithCoordinates,
  checkBranchStockForItems
} = require("../utils/inventoryService.utils");
const {
  calculateDistancesToBranches,
  findNearestBranch,
} = require("../utils/distance.utils");

class OrderController {
  /**
   * Lấy tất cả orders với filters và phân trang
   */
  static async getAllOrders(req, res, next) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        paymentStatus,
        search,
        fromDate,
        toDate,
        sortBy = "CreatedAt",
        sortOrder = "DESC",
      } = req.query;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy,
        sortOrder: sortOrder.toUpperCase(),
      };

      // Filter theo userId nếu không phải ADMIN hoặc BRANCH_MANAGER
      if (req.user.roleName !== "ADMIN" && req.user.roleName !== "BRANCH_MANAGER") {
        options.userId = req.user.id;
      }

      if (status) options.status = status;
      if (paymentStatus) options.paymentStatus = paymentStatus;
      if (search) options.search = search;
      if (fromDate) options.fromDate = new Date(fromDate);
      if (toDate) options.toDate = new Date(toDate);

      const orders = await OrderModel.findAll(options);
      const total = await OrderModel.count(options);

      res.json({
        success: true,
        data: {
          orders,
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
   * Lấy order theo ID
   */
  static async getOrderById(req, res, next) {
    try {
      const { id } = req.params;
      const { include = "all" } = req.query;

      const order = await OrderModel.findById(id);

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
          message: "You don't have permission to view this order",
        });
      }

      const includes = include === "all" ? ["items", "history"] : include.split(",").map((i) => i.trim());

      const orderData = { ...order };

      // Bao gồm order items
      if (includes.includes("items") || includes.includes("all")) {
        orderData.items = await OrderItemModel.findByOrderId(id);
      }

      // Bao gồm status history
      if (includes.includes("history") || includes.includes("all")) {
        orderData.statusHistory = await OrderStatusHistoryModel.findByOrderId(id);
      }

      res.json({
        success: true,
        data: { order: orderData },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Tạo order mới
   */
  static async createOrder(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const {
        customerName,
        customerEmail,
        customerPhone,
        shippingAddress,
        shippingWard,
        shippingDistrict,
        shippingCity,
        items, // Array of { productId, productName, productSKU, unitPrice, quantity, attributes }
        shippingFee = 0,
        tax = 0,
        discount = 0,
        paymentMethod,
        notes,
      } = req.body;

      // Tính toán tổng tiền
      let subTotal = 0;
      const processedItems = items.map((item) => {
        const itemSubTotal = item.unitPrice * item.quantity;
        subTotal += itemSubTotal;
        return {
          ...item,
          subTotal: itemSubTotal,
        };
      });

      const totalAmount = subTotal + parseFloat(shippingFee) + parseFloat(tax) - parseFloat(discount);

      // === BẮT ĐẦU LOGIC TÌM CHI NHÁNH GẦN NHẤT CÓ ĐỦ HÀNG ===

      let selectedBranchId = null;
      let branchSelectionLog = [];

      try {
        // Bước 1: Lấy tọa độ của địa chỉ giao hàng
        const fullShippingAddress = `${shippingAddress}, ${shippingWard}, ${shippingDistrict}, ${shippingCity}`;
        console.log(`📍 Đang geocode địa chỉ giao hàng: ${fullShippingAddress}`);
        
        const destinationCoords = await geocodeAddress(fullShippingAddress);
        console.log(`✅ Tọa độ giao hàng: lat=${destinationCoords.lat}, lng=${destinationCoords.lng}`);
        branchSelectionLog.push(`Địa chỉ giao hàng: ${destinationCoords.formattedAddress}`);
        branchSelectionLog.push(`Tọa độ: ${destinationCoords.lat}, ${destinationCoords.lng}`);

        // Bước 2: Lấy danh sách chi nhánh có tọa độ
        console.log(`🏢 Đang lấy danh sách chi nhánh...`);
        const branches = await getActiveBranchesWithCoordinates();
        console.log(`✅ Tìm thấy ${branches.length} chi nhánh có tọa độ`);
        branchSelectionLog.push(`Số chi nhánh khả dụng: ${branches.length}`);

        if (branches.length === 0) {
          throw new Error("Không có chi nhánh nào khả dụng");
        }

        // Bước 3: Tính khoảng cách đường chim bay đến các chi nhánh
        console.log(`📏 Đang tính khoảng cách đường chim bay đến các chi nhánh...`);
        const branchesWithDistance = calculateDistancesToBranches(
          { lat: destinationCoords.lat, lng: destinationCoords.lng },
          branches
        );
        console.log(`✅ Đã tính khoảng cách cho ${branchesWithDistance.length} chi nhánh`);

        // Log top 3 chi nhánh gần nhất
        const top3 = branchesWithDistance.slice(0, 3);
        branchSelectionLog.push(`\nTop 3 chi nhánh gần nhất:`);
        top3.forEach((b, index) => {
          console.log(`${index + 1}. ${b.name} - ${b.distanceText}`);
          branchSelectionLog.push(`${index + 1}. ${b.name} - ${b.distanceText}`);
        });

        // Bước 4: Chuẩn bị danh sách sản phẩm cần kiểm tra tồn kho
        const itemsForStockCheck = items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        }));

        // Bước 5: Kiểm tra tồn kho tại các chi nhánh theo thứ tự gần nhất
        console.log(`📦 Đang kiểm tra tồn kho tại các chi nhánh...`);
        branchSelectionLog.push(`\nKiểm tra tồn kho:`);

        for (const branch of branchesWithDistance) {
          // Bỏ qua chi nhánh không có tọa độ
          if (branch.distance === Infinity) {
            continue;
          }

          console.log(`🔍 Kiểm tra tồn kho tại: ${branch.name} (${branch.distanceText})`);
          
          try {
            const stockCheck = await checkBranchStockForItems(
              branch.id,
              itemsForStockCheck
            );

            if (stockCheck.hasStock) {
              // Tìm thấy chi nhánh có đủ hàng!
              selectedBranchId = branch.id;
              console.log(`✅ Chọn chi nhánh: ${branch.name} - ${branch.distanceText}`);
              branchSelectionLog.push(
                `✅ Chi nhánh được chọn: ${branch.name}`
              );
              branchSelectionLog.push(`   Khoảng cách: ${branch.distanceText}`);
              branchSelectionLog.push(`   Địa chỉ: ${branch.address}`);
              
              // Log chi tiết tồn kho
              stockCheck.items.forEach((item) => {
                branchSelectionLog.push(
                  `   - Sản phẩm ${item.productId}: Cần ${item.requestedQuantity}, Có ${item.availableQuantity}`
                );
              });

              break; // Dừng tìm kiếm
            } else {
              console.log(`❌ ${branch.name} không đủ hàng`);
              branchSelectionLog.push(`❌ ${branch.name}: Không đủ hàng`);
              
              // Log sản phẩm thiếu
              const outOfStockItems = stockCheck.items.filter(
                (item) => !item.hasEnoughStock
              );
              outOfStockItems.forEach((item) => {
                branchSelectionLog.push(
                  `   - Sản phẩm ${item.productId}: Cần ${item.requestedQuantity}, Chỉ còn ${item.availableQuantity}`
                );
              });
            }
          } catch (stockError) {
            console.error(
              `⚠️ Lỗi khi kiểm tra tồn kho tại ${branch.name}:`,
              stockError.message
            );
            branchSelectionLog.push(
              `⚠️ ${branch.name}: Lỗi kiểm tra tồn kho - ${stockError.message}`
            );
          }
        }

        if (!selectedBranchId) {
          console.warn(`⚠️ Không tìm thấy chi nhánh nào có đủ hàng`);
          branchSelectionLog.push(`\n⚠️ Không tìm thấy chi nhánh nào có đủ hàng cho đơn hàng này`);
        }
      } catch (branchError) {
        // Log lỗi nhưng vẫn tiếp tục tạo đơn hàng
        console.error("❌ Lỗi khi tìm chi nhánh:", branchError.message);
        branchSelectionLog.push(`❌ Lỗi: ${branchError.message}`);
        branchSelectionLog.push(`⚠️ Đơn hàng sẽ được tạo nhưng chưa gán chi nhánh`);
      }

      // === KẾT THÚC LOGIC TÌM CHI NHÁNH ===

      // Tạo order
      const orderData = {
        userId: req.user.id,
        customerName,
        customerEmail,
        customerPhone,
        shippingAddress,
        shippingWard,
        shippingDistrict,
        shippingCity,
        subTotal,
        shippingFee,
        tax,
        discount,
        totalAmount,
        paymentMethod,
        notes,
        branchId: selectedBranchId, // Gán chi nhánh đã chọn (hoặc null nếu không tìm thấy)
      };

      const order = await OrderModel.create(orderData);

      // Tạo order items
      const orderItems = await OrderItemModel.createMultiple(order.Id, processedItems);

      // Tạo initial status history
      const statusNotes = selectedBranchId
        ? `Order created and assigned to branch\n${branchSelectionLog.join("\n")}`
        : `Order created but no branch assigned yet\n${branchSelectionLog.join("\n")}`;

      await OrderStatusHistoryModel.create({
        orderId: order.Id,
        oldStatus: null,
        newStatus: "PENDING",
        changedByUserId: req.user.id,
        changedByUserName: req.user.fullName,
        notes: statusNotes,
      });

      // Nếu đã chọn được chi nhánh, tạo status history cho việc assign
      if (selectedBranchId) {
        await OrderStatusHistoryModel.create({
          orderId: order.Id,
          oldStatus: "PENDING",
          newStatus: "PENDING",
          changedByUserId: req.user.id,
          changedByUserName: req.user.fullName,
          notes: `Auto-assigned to nearest branch with stock`,
        });
      }

      res.status(201).json({
        success: true,
        message: selectedBranchId
          ? "Order created and assigned to nearest branch successfully"
          : "Order created successfully, but no branch assigned yet",
        data: {
          order: {
            ...order,
            items: orderItems,
          },
          branchSelection: {
            branchId: selectedBranchId,
            log: branchSelectionLog,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cập nhật status của order
   */
  static async updateOrderStatus(req, res, next) {
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
      const { status, notes } = req.body;

      const order = await OrderModel.findById(id);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      // Update status với user info và notes
      const updatedOrder = await OrderModel.updateStatus(id, status, req.user.id, notes);

      // Cập nhật timestamp tương ứng với status
      const timestampUpdates = {};
      if (status === "CONFIRMED") timestampUpdates.confirmedAt = new Date();
      if (status === "SHIPPING") timestampUpdates.shippedAt = new Date();
      if (status === "DELIVERED") timestampUpdates.deliveredAt = new Date();
      if (status === "CANCELLED") timestampUpdates.cancelledAt = new Date();

      if (Object.keys(timestampUpdates).length > 0) {
        await OrderModel.update(id, timestampUpdates);
      }

      res.json({
        success: true,
        message: "Order status updated successfully",
        data: { order: updatedOrder },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Hủy order
   */
  static async cancelOrder(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const order = await OrderModel.findById(id);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      // Kiểm tra quyền hủy order
      if (
        req.user.roleName !== "ADMIN" &&
        req.user.roleName !== "BRANCH_MANAGER" &&
        order.UserId.toString().toUpperCase() !== req.user.id.toUpperCase()
      ) {
        return res.status(403).json({
          success: false,
          message: "You don't have permission to cancel this order",
        });
      }

      // Kiểm tra status - chỉ có thể hủy nếu chưa SHIPPING
      if (["SHIPPING", "DELIVERED"].includes(order.Status)) {
        return res.status(400).json({
          success: false,
          message: "Cannot cancel order that is already shipping or delivered",
        });
      }

      if (order.Status === "CANCELLED") {
        return res.status(400).json({
          success: false,
          message: "Order is already cancelled",
        });
      }

      // Cập nhật status
      await OrderModel.updateStatus(id, "CANCELLED", req.user.id, reason);

      // Cập nhật cancellation info
      const updatedOrder = await OrderModel.update(id, {
        cancellationReason: reason,
        cancelledAt: new Date(),
      });

      res.json({
        success: true,
        message: "Order cancelled successfully",
        data: { order: updatedOrder },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Gán order cho branch
   */
  static async assignOrderToBranch(req, res, next) {
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
      const { branchId } = req.body;

      const order = await OrderModel.findById(id);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      if (order.BranchId) {
        return res.status(400).json({
          success: false,
          message: "Order is already assigned to a branch",
        });
      }

      const updatedOrder = await OrderModel.assignToBranch(id, branchId, req.user.id);

      res.json({
        success: true,
        message: "Order assigned to branch successfully",
        data: { order: updatedOrder },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Xóa order (chỉ ADMIN)
   */
  static async deleteOrder(req, res, next) {
    try {
      const { id } = req.params;

      const order = await OrderModel.findById(id);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      await OrderModel.delete(id);

      res.json({
        success: true,
        message: "Order deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = OrderController;
