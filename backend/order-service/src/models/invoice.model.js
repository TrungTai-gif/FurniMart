const db = require("../config/database");
const { v4: uuidv4 } = require("uuid");

class InvoiceModel {
  /**
   * Tạo invoice number tự động
   */
  static async generateInvoiceNumber() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    return `INV${year}${month}${day}${random}`;
  }

  /**
   * Tạo invoice mới từ order
   */
  static async createFromOrder(order) {
    const pool = await db.getPool();
    const invoiceId = uuidv4();
    const invoiceNumber = await this.generateInvoiceNumber();

    const customerAddress = `${order.ShippingAddress}, ${order.ShippingWard}, ${order.ShippingDistrict}, ${order.ShippingCity}`;

    const query = `
      INSERT INTO Invoices (
        Id, OrderId, InvoiceNumber,
        SubTotal, ShippingFee, Tax, Discount, TotalAmount,
        Status, CustomerName, CustomerEmail, CustomerPhone, CustomerAddress
      )
      VALUES (
        @id, @orderId, @invoiceNumber,
        @subTotal, @shippingFee, @tax, @discount, @totalAmount,
        @status, @customerName, @customerEmail, @customerPhone, @customerAddress
      );
      SELECT * FROM Invoices WHERE Id = @id;
    `;

    const request = pool.request();
    request.input("id", db.sql.UniqueIdentifier, invoiceId);
    request.input("orderId", db.sql.UniqueIdentifier, order.Id);
    request.input("invoiceNumber", db.sql.NVarChar, invoiceNumber);
    request.input("subTotal", db.sql.Decimal(18, 2), order.SubTotal);
    request.input("shippingFee", db.sql.Decimal(18, 2), order.ShippingFee);
    request.input("tax", db.sql.Decimal(18, 2), order.Tax);
    request.input("discount", db.sql.Decimal(18, 2), order.Discount);
    request.input("totalAmount", db.sql.Decimal(18, 2), order.TotalAmount);
    request.input("status", db.sql.NVarChar, order.PaymentStatus === "PAID" ? "PAID" : "UNPAID");
    request.input("customerName", db.sql.NVarChar, order.CustomerName);
    request.input("customerEmail", db.sql.NVarChar, order.CustomerEmail);
    request.input("customerPhone", db.sql.NVarChar, order.CustomerPhone);
    request.input("customerAddress", db.sql.NVarChar, customerAddress);

    const result = await request.query(query);
    return result.recordset[0];
  }

  /**
   * Tìm invoice theo order ID
   */
  static async findByOrderId(orderId) {
    const pool = await db.getPool();
    const query = "SELECT * FROM Invoices WHERE OrderId = @orderId";
    const request = pool.request();
    request.input("orderId", db.sql.UniqueIdentifier, orderId);

    const result = await request.query(query);
    return result.recordset[0] || null;
  }

  /**
   * Tìm invoice theo ID
   */
  static async findById(id) {
    const pool = await db.getPool();
    const query = "SELECT * FROM Invoices WHERE Id = @id";
    const request = pool.request();
    request.input("id", db.sql.UniqueIdentifier, id);

    const result = await request.query(query);
    return result.recordset[0] || null;
  }

  /**
   * Tìm invoice theo invoice number
   */
  static async findByInvoiceNumber(invoiceNumber) {
    const pool = await db.getPool();
    const query = "SELECT * FROM Invoices WHERE InvoiceNumber = @invoiceNumber";
    const request = pool.request();
    request.input("invoiceNumber", db.sql.NVarChar, invoiceNumber);

    const result = await request.query(query);
    return result.recordset[0] || null;
  }

  /**
   * Tìm tất cả invoices với filters
   */
  static async findAll(options = {}) {
    const pool = await db.getPool();
    let query = "SELECT * FROM Invoices WHERE 1=1";
    const request = pool.request();

    if (options.status) {
      query += " AND Status = @status";
      request.input("status", db.sql.NVarChar, options.status);
    }

    if (options.search) {
      query += " AND (InvoiceNumber LIKE @search OR CustomerName LIKE @search OR CustomerEmail LIKE @search)";
      request.input("search", db.sql.NVarChar, `%${options.search}%`);
    }

    if (options.fromDate) {
      query += " AND IssuedDate >= @fromDate";
      request.input("fromDate", db.sql.DateTime2, options.fromDate);
    }

    if (options.toDate) {
      query += " AND IssuedDate <= @toDate";
      request.input("toDate", db.sql.DateTime2, options.toDate);
    }

    // Sắp xếp
    const allowedSortFields = {
      IssuedDate: "IssuedDate",
      TotalAmount: "TotalAmount",
      InvoiceNumber: "InvoiceNumber",
    };
    const sortBy = allowedSortFields[options.sortBy] || "IssuedDate";
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
   * Đếm tổng số invoices
   */
  static async count(options = {}) {
    const pool = await db.getPool();
    let query = "SELECT COUNT(*) as total FROM Invoices WHERE 1=1";
    const request = pool.request();

    if (options.status) {
      query += " AND Status = @status";
      request.input("status", db.sql.NVarChar, options.status);
    }

    if (options.search) {
      query += " AND (InvoiceNumber LIKE @search OR CustomerName LIKE @search OR CustomerEmail LIKE @search)";
      request.input("search", db.sql.NVarChar, `%${options.search}%`);
    }

    if (options.fromDate) {
      query += " AND IssuedDate >= @fromDate";
      request.input("fromDate", db.sql.DateTime2, options.fromDate);
    }

    if (options.toDate) {
      query += " AND IssuedDate <= @toDate";
      request.input("toDate", db.sql.DateTime2, options.toDate);
    }

    const result = await request.query(query);
    return result.recordset[0].total;
  }

  /**
   * Cập nhật invoice
   */
  static async update(id, updateData) {
    const pool = await db.getPool();
    const fields = [];
    const request = pool.request();
    request.input("id", db.sql.UniqueIdentifier, id);

    const allowedFields = {
      status: { name: "Status", type: db.sql.NVarChar },
      paidDate: { name: "PaidDate", type: db.sql.DateTime2 },
      notes: { name: "Notes", type: db.sql.NVarChar },
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
      UPDATE Invoices 
      SET ${fields.join(", ")}
      WHERE Id = @id;
      SELECT * FROM Invoices WHERE Id = @id;
    `;

    const result = await request.query(query);
    return result.recordset[0] || null;
  }

  /**
   * Xóa invoice
   */
  static async delete(id) {
    const pool = await db.getPool();
    const query = "DELETE FROM Invoices WHERE Id = @id";
    const request = pool.request();
    request.input("id", db.sql.UniqueIdentifier, id);

    await request.query(query);
    return true;
  }
}

module.exports = InvoiceModel;
