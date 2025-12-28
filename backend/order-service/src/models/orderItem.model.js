const db = require("../config/database");
const { v4: uuidv4 } = require("uuid");

class OrderItemModel {
  /**
   * Tạo order item mới
   */
  static async create(itemData) {
    const pool = await db.getPool();
    const itemId = uuidv4();

    const query = `
      INSERT INTO OrderItems (
        Id, OrderId, ProductId,
        ProductName, ProductSKU, ProductImage,
        UnitPrice, Quantity, SubTotal, Attributes
      )
      VALUES (
        @id, @orderId, @productId,
        @productName, @productSKU, @productImage,
        @unitPrice, @quantity, @subTotal, @attributes
      );
      SELECT * FROM OrderItems WHERE Id = @id;
    `;

    const request = pool.request();
    request.input("id", db.sql.UniqueIdentifier, itemId);
    request.input("orderId", db.sql.UniqueIdentifier, itemData.orderId);
    request.input("productId", db.sql.UniqueIdentifier, itemData.productId);
    request.input("productName", db.sql.NVarChar, itemData.productName);
    request.input("productSKU", db.sql.NVarChar, itemData.productSKU);
    request.input("productImage", db.sql.NVarChar, itemData.productImage || null);
    request.input("unitPrice", db.sql.Decimal(18, 2), itemData.unitPrice);
    request.input("quantity", db.sql.Int, itemData.quantity);
    request.input("subTotal", db.sql.Decimal(18, 2), itemData.subTotal);
    request.input("attributes", db.sql.NVarChar, itemData.attributes ? JSON.stringify(itemData.attributes) : null);

    const result = await request.query(query);
    return result.recordset[0];
  }

  /**
   * Tạo nhiều order items cùng lúc
   */
  static async createMultiple(orderId, items) {
    const createdItems = [];
    for (const item of items) {
      const itemData = {
        orderId: orderId,
        ...item,
      };
      const createdItem = await this.create(itemData);
      createdItems.push(createdItem);
    }
    return createdItems;
  }

  /**
   * Tìm tất cả items của một order
   */
  static async findByOrderId(orderId) {
    const pool = await db.getPool();
    const query = "SELECT * FROM OrderItems WHERE OrderId = @orderId ORDER BY CreatedAt ASC";
    const request = pool.request();
    request.input("orderId", db.sql.UniqueIdentifier, orderId);

    const result = await request.query(query);
    return result.recordset;
  }

  /**
   * Tìm order item theo ID
   */
  static async findById(id) {
    const pool = await db.getPool();
    const query = "SELECT * FROM OrderItems WHERE Id = @id";
    const request = pool.request();
    request.input("id", db.sql.UniqueIdentifier, id);

    const result = await request.query(query);
    return result.recordset[0] || null;
  }

  /**
   * Xóa order item
   */
  static async delete(id) {
    const pool = await db.getPool();
    const query = "DELETE FROM OrderItems WHERE Id = @id";
    const request = pool.request();
    request.input("id", db.sql.UniqueIdentifier, id);

    await request.query(query);
    return true;
  }

  /**
   * Xóa tất cả items của một order
   */
  static async deleteByOrderId(orderId) {
    const pool = await db.getPool();
    const query = "DELETE FROM OrderItems WHERE OrderId = @orderId";
    const request = pool.request();
    request.input("orderId", db.sql.UniqueIdentifier, orderId);

    await request.query(query);
    return true;
  }
}

module.exports = OrderItemModel;
