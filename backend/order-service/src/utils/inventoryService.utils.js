const axios = require("axios");

const INVENTORY_SERVICE_URL =
  process.env.INVENTORY_SERVICE_URL || "http://inventory-service:5004";

/**
 * Lấy danh sách tất cả chi nhánh
 * @returns {Promise<Array<{id: string, name: string, address: string, phone: string, isActive: boolean, latitude: number, longitude: number}>>}
 */
async function getAllBranches() {
  try {
    const response = await axios.get(`${INVENTORY_SERVICE_URL}/api/branches`, {
      timeout: 5000,
    });

    if (response.data.success) {
      return response.data.data.branches || [];
    }

    throw new Error("Failed to fetch branches from Inventory Service");
  } catch (error) {
    if (error.code === "ECONNREFUSED") {
      console.error("❌ Cannot connect to Inventory Service");
      throw new Error("Inventory Service is not available");
    }
    console.error("❌ Error fetching branches:", error.message);
    throw error;
  }
}

/**
 * Lấy danh sách chi nhánh đang hoạt động
 * @returns {Promise<Array<{id: string, name: string, address: string, phone: string, latitude: number, longitude: number}>>}
 */
async function getActiveBranches() {
  try {
    const branches = await getAllBranches();
    return branches.filter((branch) => branch.isActive);
  } catch (error) {
    console.error("❌ Error fetching active branches:", error.message);
    throw error;
  }
}

/**
 * Lấy danh sách chi nhánh đang hoạt động và có tọa độ
 * @returns {Promise<Array<{id: string, name: string, address: string, phone: string, latitude: number, longitude: number}>>}
 */
async function getActiveBranchesWithCoordinates() {
  try {
    const branches = await getActiveBranches();
    // Lọc các chi nhánh có tọa độ hợp lệ
    return branches.filter(
      (branch) =>
        branch.latitude != null &&
        branch.longitude != null &&
        !isNaN(branch.latitude) &&
        !isNaN(branch.longitude)
    );
  } catch (error) {
    console.error(
      "❌ Error fetching active branches with coordinates:",
      error.message
    );
    throw error;
  }
}

/**
 * Kiểm tra tồn kho của sản phẩm tại một chi nhánh
 * @param {string} branchId - ID chi nhánh
 * @param {string} productId - ID sản phẩm
 * @returns {Promise<{productId: string, branchId: string, availableQuantity: number, reservedQuantity: number}>}
 */
async function checkBranchStock(branchId, productId) {
  try {
    const response = await axios.get(
      `${INVENTORY_SERVICE_URL}/api/inventory/branch/${branchId}/product/${productId}`,
      { timeout: 5000 }
    );

    if (response.data.success) {
      return response.data.data;
    }

    throw new Error("Failed to check stock at branch");
  } catch (error) {
    if (error.response && error.response.status === 404) {
      // Sản phẩm không có tại chi nhánh này
      return {
        productId,
        branchId,
        availableQuantity: 0,
        reservedQuantity: 0,
      };
    }
    console.error("❌ Error checking branch stock:", error.message);
    throw error;
  }
}

/**
 * Kiểm tra tồn kho của nhiều sản phẩm tại một chi nhánh
 * @param {string} branchId - ID chi nhánh
 * @param {Array<{productId: string, quantity: number}>} items - Danh sách sản phẩm cần kiểm tra
 * @returns {Promise<{hasStock: boolean, items: Array}>}
 */
async function checkBranchStockForItems(branchId, items) {
  try {
    const stockChecks = await Promise.all(
      items.map(async (item) => {
        const stock = await checkBranchStock(branchId, item.productId);
        return {
          productId: item.productId,
          requestedQuantity: item.quantity,
          availableQuantity: stock.availableQuantity,
          hasEnoughStock: stock.availableQuantity >= item.quantity,
        };
      })
    );

    // Kiểm tra xem tất cả sản phẩm đều có đủ hàng không
    const hasStock = stockChecks.every((item) => item.hasEnoughStock);

    return {
      branchId,
      hasStock,
      items: stockChecks,
    };
  } catch (error) {
    console.error(
      `❌ Error checking stock for items at branch ${branchId}:`,
      error.message
    );
    throw error;
  }
}

/**
 * Tìm chi nhánh có đủ hàng cho tất cả sản phẩm trong đơn
 * @param {Array<{productId: string, quantity: number}>} orderItems - Sản phẩm trong đơn hàng
 * @returns {Promise<Array<{branchId: string, branchName: string, hasStock: boolean, items: Array}>>}
 */
async function findBranchesWithStock(orderItems) {
  try {
    const branches = await getActiveBranches();

    const branchStockChecks = await Promise.all(
      branches.map(async (branch) => {
        const stockCheck = await checkBranchStockForItems(
          branch.id,
          orderItems
        );
        return {
          branchId: branch.id,
          branchName: branch.name,
          address: branch.address,
          hasStock: stockCheck.hasStock,
          items: stockCheck.items,
        };
      })
    );

    // Lọc các chi nhánh có đủ hàng
    return branchStockChecks.filter((b) => b.hasStock);
  } catch (error) {
    console.error("❌ Error finding branches with stock:", error.message);
    throw error;
  }
}

/**
 * Reserve (đặt trước) hàng tại chi nhánh
 * @param {string} branchId - ID chi nhánh
 * @param {string} orderId - ID đơn hàng
 * @param {Array<{productId: string, quantity: number}>} items - Sản phẩm cần reserve
 * @returns {Promise<{success: boolean, reservationId: string}>}
 */
async function reserveStock(branchId, orderId, items) {
  try {
    const response = await axios.post(
      `${INVENTORY_SERVICE_URL}/api/inventory/reserve`,
      {
        branchId,
        orderId,
        items,
      },
      { timeout: 5000 }
    );

    if (response.data.success) {
      return response.data.data;
    }

    throw new Error("Failed to reserve stock");
  } catch (error) {
    console.error("❌ Error reserving stock:", error.message);
    throw error;
  }
}

module.exports = {
  getAllBranches,
  getActiveBranches,
  getActiveBranchesWithCoordinates,
  checkBranchStock,
  checkBranchStockForItems,
  findBranchesWithStock,
  reserveStock,
};
