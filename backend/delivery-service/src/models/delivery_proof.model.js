// models/delivery_proof.model.js
const db = require("../config/database");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs").promises;
const path = require("path");

class DeliveryProof {
  /**
   * Lấy 1 bằng chứng giao hàng theo ID
   * @param {string} proofId - UUID của bằng chứng
   * @returns {Promise<object|null>} Proof object hoặc null nếu không tìm thấy
   */
  static async getById(proofId) {
    try {
      const pool = db.getPool();
      const result = await pool
        .request()
        .input("ProofId", db.sql.UniqueIdentifier, proofId).query(`
          SELECT * FROM DeliveryProofs 
          WHERE ProofId = @ProofId
        `);

      return result.recordset[0] || null;
    } catch (error) {
      console.error("Lỗi lấy bằng chứng theo ID:", error);
      throw error;
    }
  }

  /**
   * Lấy tất cả bằng chứng của một đơn giao hàng
   * @param {string} deliveryId - UUID của đơn giao hàng
   * @returns {Promise<Array<object>>} Danh sách bằng chứng, sắp xếp mới nhất trước
   */
  static async getByDeliveryId(deliveryId) {
    try {
      const pool = db.getPool();
      const result = await pool
        .request()
        .input("DeliveryId", db.sql.UniqueIdentifier, deliveryId).query(`
          SELECT * FROM DeliveryProofs 
          WHERE DeliveryId = @DeliveryId 
          ORDER BY CreatedAt DESC
        `);

      return result.recordset;
    } catch (error) {
      console.error("Lỗi lấy bằng chứng theo đơn giao hàng:", error);
      throw error;
    }
  }

  /**
   * (Tùy chọn) Lấy bằng chứng theo loại (Photo, Signature, Document, ...)
   * @param {string} deliveryId
   * @param {string} proofType
   */
  static async getByType(deliveryId, proofType) {
    try {
      const pool = db.getPool();
      const result = await pool
        .request()
        .input("DeliveryId", db.sql.UniqueIdentifier, deliveryId)
        .input("ProofType", db.sql.NVarChar(50), proofType).query(`
          SELECT * FROM DeliveryProofs 
          WHERE DeliveryId = @DeliveryId 
            AND ProofType = @ProofType 
          ORDER BY CreatedAt DESC
        `);

      return result.recordset;
    } catch (error) {
      console.error("Lỗi lấy bằng chứng theo loại:", error);
      throw error;
    }
  }

  /**
   * Tạo mới bằng chứng giao hàng (ảnh, chữ ký, tài liệu, ...)
   * @param {object} data - Dữ liệu bằng chứng
   * @param {string} data.deliveryId
   * @param {string} data.fileUrl - Đường dẫn URL (ví dụ: /uploads/filename.jpg)
   * @param {string} data.fileName
   * @param {string} data.fileType (mimetype)
   * @param {number} data.fileSize (bytes)
   * @param {string|null} data.description
   * @param {string|null} data.uploadedBy - User ID
   * @param {string} [data.proofType="Photo"] - Loại bằng chứng
   */
  static async create({
    deliveryId,
    fileUrl,
    fileName,
    fileType,
    fileSize,
    uploadedBy,
    description = null,
    proofType = "Photo",
  }) {
    try {
      const pool = db.getPool();
      const proofId = uuidv4();

      const request = pool.request();

      request.input("ProofId", db.sql.UniqueIdentifier, proofId);
      request.input("DeliveryId", db.sql.UniqueIdentifier, deliveryId);
      request.input("FileUrl", db.sql.NVarChar(500), fileUrl); // Lưu URL thay vì path vật lý
      request.input("FileName", db.sql.NVarChar(255), fileName);
      request.input("FileType", db.sql.NVarChar(100), fileType || null);
      request.input("FileSize", db.sql.BigInt, fileSize || null);
      request.input("Description", db.sql.NVarChar(500), description);
      request.input("UploadedBy", db.sql.UniqueIdentifier, uploadedBy || null);
      request.input("ProofType", db.sql.NVarChar(50), proofType);

      await request.query(`
        INSERT INTO DeliveryProofs (
          ProofId, DeliveryId, FileUrl, FileName, FileType, FileSize, 
          Description, UploadedBy, ProofType, CreatedAt
        ) VALUES (
          @ProofId, @DeliveryId, @FileUrl, @FileName, @FileType, @FileSize,
          @Description, @UploadedBy, @ProofType, GETUTCDATE()
        )
      `);

      return await this.getById(proofId);
    } catch (error) {
      console.error("Lỗi tạo bằng chứng giao hàng:", error);
      throw error;
    }
  }

  /**
   * Xóa bằng chứng theo ID
   * - Xóa file vật lý nếu tồn tại
   * - Xóa record trong database
   * @param {string} proofId
   * @returns {Promise<boolean>} true nếu xóa thành công
   */
  static async delete(proofId) {
    try {
      const pool = db.getPool();

      const proof = await this.getById(proofId);
      if (!proof) {
        throw new Error("Không tìm thấy bằng chứng");
      }

      // Xóa file vật lý (nếu lưu path local)
      // Lưu ý: Nếu dùng URL (S3, Cloudinary), bỏ phần fs.unlink
      if (proof.FileUrl?.startsWith("/uploads/")) {
        const fileName = proof.FileUrl.replace("/uploads/", "");
        const filePath = path.join(
          process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads"),
          fileName
        );

        try {
          await fs.access(filePath);
          await fs.unlink(filePath);
          console.log(`Đã xóa file: ${filePath}`);
        } catch (fsErr) {
          console.warn("Không thể xóa file vật lý:", fsErr.message);
          // Không throw lỗi để tránh ảnh hưởng đến việc xóa DB
        }
      }

      // Xóa record trong DB
      await pool.request().input("ProofId", db.sql.UniqueIdentifier, proofId)
        .query(`
          DELETE FROM DeliveryProofs 
          WHERE ProofId = @ProofId
        `);

      return true;
    } catch (error) {
      console.error("Lỗi xóa bằng chứng:", error);
      throw error;
    }
  }
}

module.exports = DeliveryProof;
