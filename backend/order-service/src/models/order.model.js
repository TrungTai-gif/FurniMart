const db = require("../config/database");
const { v4: uuidv4 } = require("uuid");

class OrderModel {
  /**
   * Chuyển đổi UUID sang uppercase string
   */
  static normalizeId(id) {
    if (!id) return null;
    if (Buffer.isBuffer(id)) {
      return id.toString("hex").toUpperCase();
    }
    if (typeof id === "object" && id.toString) {
      return id.toString().toUpperCase();
    }
    return String(id).trim().toUpperCase();
  }

  /**
   * Tạo order number tự động
   */
  static async generateOrderNumber() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    return `ORD${year}${month}${day}${random}`;
  }

  /**
   * Tạo order mới
   */
  static async create(orderData) {
    const pool = await db.getPool();
    const orderId = uuidv4();
    const orderNumber = await this.generateOrderNumber();

    const query = `
      INSERT INTO Orders (
        Id, OrderNumber, UserId, BranchId,
        CustomerName, CustomerEmail, CustomerPhone,
        ShippingAddress, ShippingWard, ShippingDistrict, ShippingCity,
        SubTotal, ShippingFee, Tax, Discount, TotalAmount,
        Status, PaymentStatus, PaymentMethod, Notes
      )
      VALUES (
        @id, @orderNumber, @userId, @branchId,
        @customerName, @customerEmail, @customerPhone,
        @shippingAddress, @shippingWard, @shippingDistrict, @shippingCity,
        @subTotal, @shippingFee, @tax, @discount, @totalAmount,
        @status, @paymentStatus, @paymentMethod, @notes
      );
      SELECT * FROM Orders WHERE Id = @id;
    `;

    const request = pool.request();
    request.input("id", db.sql.UniqueIdentifier, orderId);
    request.input("orderNumber", db.sql.NVarChar, orderNumber);
    request.input("userId", db.sql.UniqueIdentifier, orderData.userId);
    request.input("branchId", db.sql.Int, orderData.branchId || null);
    request.input("customerName", db.sql.NVarChar, orderData.customerName);
    request.input("customerEmail", db.sql.NVarChar, orderData.customerEmail);
    request.input("customerPhone", db.sql.NVarChar, orderData.customerPhone);
    request.input("shippingAddress", db.sql.NVarChar, orderData.shippingAddress);
    request.input("shippingWard", db.sql.NVarChar, orderData.shippingWard);
    request.input("shippingDistrict", db.sql.NVarChar, orderData.shippingDistrict);
    request.input("shippingCity", db.sql.NVarChar, orderData.shippingCity);
    request.input("subTotal", db.sql.Decimal(18, 2), orderData.subTotal);
    request.input("shippingFee", db.sql.Decimal(18, 2), orderData.shippingFee || 0);
    request.input("tax", db.sql.Decimal(18, 2), orderData.tax || 0);
    request.input("discount", db.sql.Decimal(18, 2), orderData.discount || 0);
    request.input("totalAmount", db.sql.Decimal(18, 2), orderData.totalAmount);
    request.input("status", db.sql.NVarChar, orderData.status || "PENDING");
    request.input("paymentStatus", db.sql.NVarChar, orderData.paymentStatus || "PENDING");
    request.input("paymentMethod", db.sql.NVarChar, orderData.paymentMethod || null);
    request.input("notes", db.sql.NVarChar, orderData.notes || null);

    const result = await request.query(query);
    return result.recordset[0];
  }

  /**
   * Tìm tất cả orders với filters
   */
  static async findAll(options = {}) {
    const pool = await db.getPool();
    let query = "SELECT * FROM Orders WHERE 1=1";
    const request = pool.request();

    if (options.userId) {
      query += " AND UserId = @userId";
      request.input("userId", db.sql.UniqueIdentifier, options.userId);
    }

    if (options.branchId) {
      query += " AND BranchId = @branchId";
      request.input("branchId", db.sql.Int, options.branchId);
    }

    if (options.status) {
      query += " AND Status = @status";
      request.input("status", db.sql.NVarChar, options.status);
    }

    if (options.paymentStatus) {
      query += " AND PaymentStatus = @paymentStatus";
      request.input("paymentStatus", db.sql.NVarChar, options.paymentStatus);
    }

    if (options.search) {
      query += " AND (OrderNumber LIKE @search OR CustomerName LIKE @search OR CustomerEmail LIKE @search OR CustomerPhone LIKE @search)";
      request.input("search", db.sql.NVarChar, `%${options.search}%`);
    }

    if (options.fromDate) {
      query += " AND CreatedAt >= @fromDate";
      request.input("fromDate", db.sql.DateTime2, options.fromDate);
    }

    if (options.toDate) {
      query += " AND CreatedAt <= @toDate";
      request.input("toDate", db.sql.DateTime2, options.toDate);
    }

    // Sắp xếp
    const allowedSortFields = {
      CreatedAt: "CreatedAt",
      UpdatedAt: "UpdatedAt",
      TotalAmount: "TotalAmount",
      OrderNumber: "OrderNumber",
    };
    const sortBy = allowedSortFields[options.sortBy] || "CreatedAt";
    const sortOrder = options.sortOrder?.toUpperCase() === "ASC" ? "ASC" : "DESC";
    query += ` ORDER BY ${sortBy} ${sortOrder}`;

    // Phân trang
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;
    query += ` OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;
    request.input("offset", db.sql.Int, offset);
    request.input("limit", db.sql.Int, limit);

    const result = await request.query(query);
    return result.recordset;
  }

  /**
   * Đếm tổng số orders
   */
  static async count(options = {}) {
    const pool = await db.getPool();
    let query = "SELECT COUNT(*) as total FROM Orders WHERE 1=1";
    const request = pool.request();

    if (options.userId) {
      query += " AND UserId = @userId";
      request.input("userId", db.sql.UniqueIdentifier, options.userId);
    }

    if (options.branchId) {
      query += " AND BranchId = @branchId";
      request.input("branchId", db.sql.Int, options.branchId);
    }

    if (options.status) {
      query += " AND Status = @status";
      request.input("status", db.sql.NVarChar, options.status);
    }

    if (options.paymentStatus) {
      query += " AND PaymentStatus = @paymentStatus";
      request.input("paymentStatus", db.sql.NVarChar, options.paymentStatus);
    }

    if (options.search) {
      query += " AND (OrderNumber LIKE @search OR CustomerName LIKE @search OR CustomerEmail LIKE @search OR CustomerPhone LIKE @search)";
      request.input("search", db.sql.NVarChar, `%${options.search}%`);
    }

    if (options.fromDate) {
      query += " AND CreatedAt >= @fromDate";
      request.input("fromDate", db.sql.DateTime2, options.fromDate);
    }

    if (options.toDate) {
      query += " AND CreatedAt <= @toDate";
      request.input("toDate", db.sql.DateTime2, options.toDate);
    }

    const result = await request.query(query);
    return result.recordset[0].total;
  }

  /**
   * Tìm order theo ID
   */
  static async findById(id) {
    const pool = await db.getPool();
    const query = "SELECT * FROM Orders WHERE Id = @id";
    const request = pool.request();
    request.input("id", db.sql.UniqueIdentifier, id);

    const result = await request.query(query);
    return result.recordset[0] || null;
  }

  /**
   * Tìm order theo order number
   */
  static async findByOrderNumber(orderNumber) {
    const pool = await db.getPool();
    const query = "SELECT * FROM Orders WHERE OrderNumber = @orderNumber";
    const request = pool.request();
    request.input("orderNumber", db.sql.NVarChar, orderNumber);

    const result = await request.query(query);
    return result.recordset[0] || null;
  }

  /**
   * Cập nhật order
   */
  static async update(id, updateData) {
    const pool = await db.getPool();
    const fields = [];
    const request = pool.request();
    request.input("id", db.sql.UniqueIdentifier, id);

    const allowedFields = {
      branchId: { name: "BranchId", type: db.sql.Int },
      status: { name: "Status", type: db.sql.NVarChar },
      paymentStatus: { name: "PaymentStatus", type: db.sql.NVarChar },
      paymentMethod: { name: "PaymentMethod", type: db.sql.NVarChar },
      notes: { name: "Notes", type: db.sql.NVarChar },
      cancellationReason: { name: "CancellationReason", type: db.sql.NVarChar },
      confirmedAt: { name: "ConfirmedAt", type: db.sql.DateTime2 },
      shippedAt: { name: "ShippedAt", type: db.sql.DateTime2 },
      deliveredAt: { name: "DeliveredAt", type: db.sql.DateTime2 },
      cancelledAt: { name: "CancelledAt", type: db.sql.DateTime2 },
    };

    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields[key]) {
        const field = allowedFields[key];
        fields.push(`${field.name} = @${key}`);
        request.input(key, field.type, value);
      }
    }

    if (fields.length === 0) {
      throw new Error("No valid fields to update");
    }

    const query = `
      UPDATE Orders 
      SET ${fields.join(", ")}
      WHERE Id = @id;
      SELECT * FROM Orders WHERE Id = @id;
    `;

    const result = await request.query(query);
    return result.recordset[0] || null;
  }

  /**
   * Cập nhật status của order
   */
  static async updateStatus(id, newStatus, userId = null, notes = null) {
    const pool = await db.getPool();
    const transaction = new db.sql.Transaction(pool);

    try {
      await transaction.begin();

      // Lấy order hiện tại
      const getCurrentQuery = "SELECT Status FROM Orders WHERE Id = @id";
      const getCurrentRequest = new db.sql.Request(transaction);
      getCurrentRequest.input("id", db.sql.UniqueIdentifier, id);
      const currentResult = await getCurrentRequest.query(getCurrentQuery);
      
      if (!currentResult.recordset[0]) {
        throw new Error("Order not found");
      }

      const oldStatus = currentResult.recordset[0].Status;

      // Cập nhật status
      const updateQuery = "UPDATE Orders SET Status = @newStatus WHERE Id = @id";
      const updateRequest = new db.sql.Request(transaction);
      updateRequest.input("id", db.sql.UniqueIdentifier, id);
      updateRequest.input("newStatus", db.sql.NVarChar, newStatus);
      await updateRequest.query(updateQuery);

      // Thêm vào history
      const historyQuery = `
        INSERT INTO OrderStatusHistory (OrderId, OldStatus, NewStatus, ChangedByUserId, Notes)
        VALUES (@orderId, @oldStatus, @newStatus, @changedByUserId, @notes)
      `;
      const historyRequest = new db.sql.Request(transaction);
      historyRequest.input("orderId", db.sql.UniqueIdentifier, id);
      historyRequest.input("oldStatus", db.sql.NVarChar, oldStatus);
      historyRequest.input("newStatus", db.sql.NVarChar, newStatus);
      historyRequest.input("changedByUserId", db.sql.UniqueIdentifier, userId);
      historyRequest.input("notes", db.sql.NVarChar, notes);
      await historyRequest.query(historyQuery);

      await transaction.commit();

      // Lấy order đã được cập nhật
      return await this.findById(id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Xóa order (soft delete bằng cách đổi status)
   */
  static async delete(id) {
    const pool = await db.getPool();
    const query = "DELETE FROM Orders WHERE Id = @id";
    const request = pool.request();
    request.input("id", db.sql.UniqueIdentifier, id);

    await request.query(query);
    return true;
  }

  /**
   * Gán order cho branch
   */
  static async assignToBranch(id, branchId, userId = null) {
    const updateData = {
      branchId: branchId,
    };
    
    const order = await this.update(id, updateData);
    
    // Log vào history
    const pool = await db.getPool();
    const historyQuery = `
      INSERT INTO OrderStatusHistory (OrderId, OldStatus, NewStatus, ChangedByUserId, Notes)
      VALUES (@orderId, @oldStatus, @newStatus, @changedByUserId, @notes)
    `;
    const request = pool.request();
    request.input("orderId", db.sql.UniqueIdentifier, id);
    request.input("oldStatus", db.sql.NVarChar, order.Status);
    request.input("newStatus", db.sql.NVarChar, order.Status);
    request.input("changedByUserId", db.sql.UniqueIdentifier, userId);
    request.input("notes", db.sql.NVarChar, `Assigned to branch ID: ${branchId}`);
    await request.query(historyQuery);

    return order;
  }
}

module.exports = OrderModel;
