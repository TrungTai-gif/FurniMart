// models/delivery_order.model.js
const db = require("../config/database");
const { v4: uuidv4 } = require("uuid");

class DeliveryOrder {
  // ------------------- LẤY THÔNG TIN ĐƠN GIAO HÀNG -------------------

  /**
   * Lấy 1 đơn giao hàng theo ID
   * @param {string} deliveryId - UUID của đơn
   * @returns {Promise<object|null>} Delivery object hoặc null nếu không tìm thấy
   */
  static async getById(deliveryId) {
    try {
      const pool = db.getPool();
      const result = await pool
        .request()
        .input("DeliveryId", db.sql.UniqueIdentifier, deliveryId).query(`
          SELECT * FROM DeliveryOrders 
          WHERE DeliveryId = @DeliveryId
        `);

      return result.recordset[0] || null;
    } catch (error) {
      console.error("Lỗi lấy đơn theo ID:", error);
      throw error;
    }
  }

  /**
   * Lấy tất cả đơn giao hàng theo OrderId
   * @param {string} orderId - UUID của đơn hàng gốc
   */
  static async getByOrderId(orderId) {
    try {
      const pool = db.getPool();
      const result = await pool
        .request()
        .input("OrderId", db.sql.UniqueIdentifier, orderId).query(`
          SELECT * FROM DeliveryOrders 
          WHERE OrderId = @OrderId 
          ORDER BY CreatedAt DESC
        `);

      return result.recordset;
    } catch (error) {
      console.error("Lỗi lấy đơn theo OrderId:", error);
      throw error;
    }
  }

  /**
   * Lấy danh sách đơn giao hàng của 1 nhân viên (có filter + phân trang)
   * @param {string} staffId - UUID nhân viên
   * @param {object} filters - {status?, page?, limit?}
   */
  static async getByStaffId(staffId, filters = {}) {
    try {
      const pool = db.getPool();
      const request = pool.request();

      request.input("DeliveryStaffId", db.sql.UniqueIdentifier, staffId);

      let query = `
        SELECT * FROM DeliveryOrders 
        WHERE DeliveryStaffId = @DeliveryStaffId
      `;

      if (filters.status) {
        request.input("Status", db.sql.NVarChar(50), filters.status);
        query += " AND DeliveryStatus = @Status";
      }

      query += " ORDER BY CreatedAt DESC";

      // Phân trang
      if (filters.page && filters.limit) {
        const offset = (filters.page - 1) * filters.limit;
        request.input("Offset", db.sql.Int, offset);
        request.input("Limit", db.sql.Int, filters.limit);
        query += " OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY";
      }

      const result = await request.query(query);
      return result.recordset;
    } catch (error) {
      console.error("Lỗi lấy đơn theo nhân viên:", error);
      throw error;
    }
  }

  /**
   * Lấy tất cả đơn (dành cho Admin/Manager, có filter + phân trang)
   * @param {object} filters - {status?, branchId?, staffId?, page?, limit?}
   */
  static async getAll(filters = {}) {
    try {
      const pool = db.getPool();
      const request = pool.request();

      let query = "SELECT * FROM DeliveryOrders WHERE 1=1";

      if (filters.status) {
        request.input("Status", db.sql.NVarChar(50), filters.status);
        query += " AND DeliveryStatus = @Status";
      }

      if (filters.branchId) {
        request.input("BranchId", db.sql.UniqueIdentifier, filters.branchId);
        query += " AND BranchId = @BranchId";
      }

      if (filters.staffId) {
        request.input("StaffId", db.sql.UniqueIdentifier, filters.staffId);
        query += " AND DeliveryStaffId = @StaffId";
      }

      query += " ORDER BY CreatedAt DESC";

      // Phân trang
      if (filters.page && filters.limit) {
        const offset = (filters.page - 1) * filters.limit;
        request.input("Offset", db.sql.Int, offset);
        request.input("Limit", db.sql.Int, filters.limit);
        query += " OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY";
      }

      const result = await request.query(query);
      return result.recordset;
    } catch (error) {
      console.error("Lỗi lấy tất cả đơn:", error);
      throw error;
    }
  }

  // ------------------- TẠO ĐƠN GIAO HÀNG MỚI -------------------

  /**
   * Tạo đơn giao hàng mới (sử dụng transaction)
   * @param {object} data - Dữ liệu đầu vào từ controller
   */
  static async create(data) {
    const pool = db.getPool();
    const transaction = new db.sql.Transaction(pool);

    try {
      await transaction.begin();
      const request = new db.sql.Request(transaction);

      const deliveryId = uuidv4();

      // Bind parameters
      request.input("DeliveryId", db.sql.UniqueIdentifier, deliveryId);
      request.input("OrderId", db.sql.UniqueIdentifier, data.orderId);
      request.input("BranchId", db.sql.UniqueIdentifier, data.branchId || null);
      request.input(
        "DeliveryStaffId",
        db.sql.UniqueIdentifier,
        data.deliveryStaffId || null
      );
      request.input("Priority", db.sql.NVarChar(20), data.priority || "Normal");
      request.input(
        "EstimatedDeliveryDate",
        db.sql.DateTime2,
        data.estimatedDeliveryDate ? new Date(data.estimatedDeliveryDate) : null
      );
      request.input("DeliveryAddress", db.sql.NVarChar, data.deliveryAddress);
      request.input("DeliveryCity", db.sql.NVarChar(100), data.deliveryCity);
      request.input(
        "DeliveryDistrict",
        db.sql.NVarChar(100),
        data.deliveryDistrict
      );
      request.input(
        "DeliveryWard",
        db.sql.NVarChar(100),
        data.deliveryWard || null
      );
      request.input(
        "DeliveryPostalCode",
        db.sql.NVarChar(20),
        data.deliveryPostalCode || null
      );
      request.input("RecipientName", db.sql.NVarChar(255), data.recipientName);
      request.input("RecipientPhone", db.sql.NVarChar(20), data.recipientPhone);
      request.input(
        "DeliveryInstructions",
        db.sql.NVarChar(500),
        data.deliveryInstructions || null
      );
      request.input("Latitude", db.sql.Decimal(10, 8), data.latitude || null);
      request.input("Longitude", db.sql.Decimal(11, 8), data.longitude || null);
      request.input(
        "DistanceKm",
        db.sql.Decimal(10, 2),
        data.distanceKm || null
      );
      request.input(
        "DeliveryFee",
        db.sql.Decimal(18, 2),
        data.deliveryFee || 0
      );
      request.input("Notes", db.sql.NVarChar, data.notes || null);

      await request.query(`
        INSERT INTO DeliveryOrders (
          DeliveryId, OrderId, BranchId, DeliveryStaffId, Priority,
          EstimatedDeliveryDate, DeliveryAddress, DeliveryCity, DeliveryDistrict,
          DeliveryWard, DeliveryPostalCode, RecipientName, RecipientPhone,
          DeliveryInstructions, Latitude, Longitude, DistanceKm, DeliveryFee, Notes,
          DeliveryStatus, CreatedAt, UpdatedAt
        ) VALUES (
          @DeliveryId, @OrderId, @BranchId, @DeliveryStaffId, @Priority,
          @EstimatedDeliveryDate, @DeliveryAddress, @DeliveryCity, @DeliveryDistrict,
          @DeliveryWard, @DeliveryPostalCode, @RecipientName, @RecipientPhone,
          @DeliveryInstructions, @Latitude, @Longitude, @DistanceKm, @DeliveryFee, @Notes,
          'Pending', GETUTCDATE(), GETUTCDATE()
        )
      `);

      // Thêm lịch sử trạng thái ban đầu
      const historyReq = new db.sql.Request(transaction);
      historyReq.input("DeliveryId", db.sql.UniqueIdentifier, deliveryId);
      historyReq.input("NewStatus", db.sql.NVarChar(50), "Pending");
      historyReq.input("ChangedByType", db.sql.NVarChar(20), "System");

      await historyReq.query(`
        INSERT INTO DeliveryStatusHistory (DeliveryId, NewStatus, ChangedByType, CreatedAt)
        VALUES (@DeliveryId, @NewStatus, @ChangedByType, GETUTCDATE())
      `);

      await transaction.commit();

      return await this.getById(deliveryId);
    } catch (error) {
      await transaction.rollback();
      console.error("Lỗi tạo đơn giao hàng:", error);
      throw error;
    }
  }

  // ------------------- CẬP NHẬT TRẠNG THÁI -------------------

  /**
   * Cập nhật trạng thái đơn + ghi lịch sử (transaction)
   * @param {string} deliveryId
   * @param {string} newStatus
   * @param {string|null} changedBy - User ID
   * @param {string} changedByType - 'Staff' | 'System'
   * @param {string|null} notes
   * @param {string|null} location
   * @param {number|null} latitude
   * @param {number|null} longitude
   */
  static async updateStatus(
    deliveryId,
    newStatus,
    changedBy,
    changedByType,
    notes = null,
    location = null,
    latitude = null,
    longitude = null
  ) {
    const pool = db.getPool();
    const transaction = new db.sql.Transaction(pool);

    try {
      await transaction.begin();

      const current = await this.getById(deliveryId);
      if (!current) throw new Error("Không tìm thấy đơn giao hàng");

      const previousStatus = current.DeliveryStatus;

      // Quy tắc chuyển trạng thái hợp lệ
      const validTransitions = {
        Pending: ["Assigned", "Cancelled"],
        Assigned: ["InTransit", "Cancelled"],
        InTransit: ["Delivered", "Failed", "Returned"],
        Delivered: [],
        Failed: ["InTransit", "Cancelled"],
        Cancelled: [],
        Returned: [],
      };

      if (!validTransitions[previousStatus]?.includes(newStatus)) {
        throw new Error(
          `Chuyển trạng thái không hợp lệ: ${previousStatus} → ${newStatus}`
        );
      }

      const updateReq = new db.sql.Request(transaction);
      updateReq.input("DeliveryId", db.sql.UniqueIdentifier, deliveryId);
      updateReq.input("NewStatus", db.sql.NVarChar(50), newStatus);

      let updateQuery = `
        UPDATE DeliveryOrders 
        SET DeliveryStatus = @NewStatus, UpdatedAt = GETUTCDATE()
      `;

      if (newStatus === "Assigned")
        updateQuery += ", AssignedAt = GETUTCDATE()";
      else if (newStatus === "InTransit")
        updateQuery += ", PickedUpAt = GETUTCDATE()";
      else if (newStatus === "Delivered") {
        updateQuery +=
          ", DeliveredAt = GETUTCDATE(), ActualDeliveryDate = GETUTCDATE()";
      }

      updateQuery += " WHERE DeliveryId = @DeliveryId";

      await updateReq.query(updateQuery);

      // Ghi lịch sử
      const historyReq = new db.sql.Request(transaction);
      historyReq.input("DeliveryId", db.sql.UniqueIdentifier, deliveryId);
      historyReq.input("PreviousStatus", db.sql.NVarChar(50), previousStatus);
      historyReq.input("NewStatus", db.sql.NVarChar(50), newStatus);
      historyReq.input("ChangedBy", db.sql.UniqueIdentifier, changedBy || null);
      historyReq.input(
        "ChangedByType",
        db.sql.NVarChar(20),
        changedByType || "System"
      );
      historyReq.input("Notes", db.sql.NVarChar(500), notes || null);
      historyReq.input("Location", db.sql.NVarChar(255), location || null);
      historyReq.input("Latitude", db.sql.Decimal(10, 8), latitude || null);
      historyReq.input("Longitude", db.sql.Decimal(11, 8), longitude || null);

      await historyReq.query(`
        INSERT INTO DeliveryStatusHistory (
          DeliveryId, PreviousStatus, NewStatus, ChangedBy, ChangedByType,
          Notes, Location, Latitude, Longitude, CreatedAt
        ) VALUES (
          @DeliveryId, @PreviousStatus, @NewStatus, @ChangedBy, @ChangedByType,
          @Notes, @Location, @Latitude, @Longitude, GETUTCDATE()
        )
      `);

      await transaction.commit();

      return await this.getById(deliveryId);
    } catch (error) {
      await transaction.rollback();
      console.error("Lỗi cập nhật trạng thái:", error);
      throw error;
    }
  }

  // ------------------- GIAO ĐƠN CHO NHÂN VIÊN -------------------

  /**
   * Giao đơn cho nhân viên + cập nhật trạng thái thành Assigned
   */
  static async assign(deliveryId, staffId, assignedBy) {
    try {
      const pool = db.getPool();
      const request = pool.request();

      request.input("DeliveryId", db.sql.UniqueIdentifier, deliveryId);
      request.input("StaffId", db.sql.UniqueIdentifier, staffId);

      await request.query(`
        UPDATE DeliveryOrders
        SET DeliveryStaffId = @StaffId, 
            AssignedAt = GETUTCDATE(), 
            UpdatedAt = GETUTCDATE()
        WHERE DeliveryId = @DeliveryId
      `);

      // Cập nhật trạng thái
      return await this.updateStatus(
        deliveryId,
        "Assigned",
        assignedBy,
        "Staff"
      );
    } catch (error) {
      console.error("Lỗi giao đơn:", error);
      throw error;
    }
  }

  // ------------------- LỊCH SỬ TRẠNG THÁI -------------------

  static async getStatusHistory(deliveryId) {
    try {
      const pool = db.getPool();
      const result = await pool
        .request()
        .input("DeliveryId", db.sql.UniqueIdentifier, deliveryId).query(`
          SELECT * FROM DeliveryStatusHistory 
          WHERE DeliveryId = @DeliveryId 
          ORDER BY CreatedAt ASC
        `);

      return result.recordset;
    } catch (error) {
      console.error("Lỗi lấy lịch sử trạng thái:", error);
      throw error;
    }
  }

  // ------------------- (Tạm thời giữ nguyên phần Proof, nhưng nên tách riêng model) -------------------

  // ... Các phương thức liên quan đến Proof nên được chuyển sang DeliveryProof.model.js
  // Ví dụ:
  // static async getProofs(deliveryId) { ... }
  // static async addProof(...) { ... }
  // static async deleteProof(...) { ... }
}

module.exports = DeliveryOrder;
