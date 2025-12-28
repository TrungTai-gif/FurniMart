const db = require("../config/database");

class OrderStatusHistoryModel {
  /**
   * Tạo bản ghi status history mới
   */
  static async create(historyData) {
    const pool = await db.getPool();
    const query = `
      INSERT INTO OrderStatusHistory (
        OrderId, OldStatus, NewStatus,
        ChangedByUserId, ChangedByUserName, Notes
      )
      VALUES (
        @orderId, @oldStatus, @newStatus,
        @changedByUserId, @changedByUserName, @notes
      );
      SELECT * FROM OrderStatusHistory WHERE Id = SCOPE_IDENTITY();
    `;

    const request = pool.request();
    request.input("orderId", db.sql.UniqueIdentifier, historyData.orderId);
    request.input("oldStatus", db.sql.NVarChar, historyData.oldStatus || null);
    request.input("newStatus", db.sql.NVarChar, historyData.newStatus);
    request.input("changedByUserId", db.sql.UniqueIdentifier, historyData.changedByUserId || null);
    request.input("changedByUserName", db.sql.NVarChar, historyData.changedByUserName || null);
    request.input("notes", db.sql.NVarChar, historyData.notes || null);

    const result = await request.query(query);
    return result.recordset[0];
  }

  /**
   * Tìm tất cả history của một order
   */
  static async findByOrderId(orderId) {
    const pool = await db.getPool();
    const query = `
      SELECT * FROM OrderStatusHistory 
      WHERE OrderId = @orderId 
      ORDER BY CreatedAt DESC
    `;
    const request = pool.request();
    request.input("orderId", db.sql.UniqueIdentifier, orderId);

    const result = await request.query(query);
    return result.recordset;
  }

  /**
   * Tìm history record theo ID
   */
  static async findById(id) {
    const pool = await db.getPool();
    const query = "SELECT * FROM OrderStatusHistory WHERE Id = @id";
    const request = pool.request();
    request.input("id", db.sql.Int, id);

    const result = await request.query(query);
    return result.recordset[0] || null;
  }
}

module.exports = OrderStatusHistoryModel;
