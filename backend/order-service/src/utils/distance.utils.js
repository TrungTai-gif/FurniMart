/**
 * Tính khoảng cách đường chim bay (as-the-crow-flies) giữa 2 điểm sử dụng công thức Haversine
 * @param {number} lat1 - Vĩ độ điểm 1
 * @param {number} lon1 - Kinh độ điểm 1
 * @param {number} lat2 - Vĩ độ điểm 2
 * @param {number} lon2 - Kinh độ điểm 2
 * @returns {number} Khoảng cách tính bằng mét
 */
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  // Bán kính Trái Đất tính bằng mét
  const R = 6371000;

  // Chuyển đổi độ sang radian
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  // Công thức Haversine
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  // Khoảng cách tính bằng mét
  const distance = R * c;

  return distance;
}

/**
 * Format khoảng cách thành text dễ đọc
 * @param {number} distanceInMeters - Khoảng cách tính bằng mét
 * @returns {string} Ví dụ: "5.2 km" hoặc "850 m"
 */
function formatDistance(distanceInMeters) {
  if (distanceInMeters >= 1000) {
    return `${(distanceInMeters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(distanceInMeters)} m`;
}

/**
 * Tính khoảng cách từ một địa chỉ (với tọa độ) đến nhiều chi nhánh
 * @param {Object} destination - {lat: number, lng: number, address: string}
 * @param {Array<Object>} branches - [{id, name, address, latitude, longitude}]
 * @returns {Array<Object>} Danh sách chi nhánh với khoảng cách, đã được sắp xếp từ gần đến xa
 */
function calculateDistancesToBranches(destination, branches) {
  if (!destination || !destination.lat || !destination.lng) {
    throw new Error("Destination must have lat and lng coordinates");
  }

  if (!branches || branches.length === 0) {
    return [];
  }

  // Tính khoảng cách cho từng chi nhánh
  const branchesWithDistance = branches
    .map((branch) => {
      // Kiểm tra chi nhánh có tọa độ không
      if (
        branch.latitude == null ||
        branch.longitude == null ||
        isNaN(branch.latitude) ||
        isNaN(branch.longitude)
      ) {
        console.warn(
          `⚠️ Branch ${branch.id} (${branch.name}) không có tọa độ hợp lệ`
        );
        return {
          ...branch,
          distance: Infinity,
          distanceText: "N/A",
          error: "NO_COORDINATES",
        };
      }

      const distance = calculateHaversineDistance(
        destination.lat,
        destination.lng,
        branch.latitude,
        branch.longitude
      );

      return {
        ...branch,
        distance: distance, // mét
        distanceText: formatDistance(distance),
      };
    })
    .sort((a, b) => a.distance - b.distance); // Sắp xếp từ gần đến xa

  return branchesWithDistance;
}

/**
 * Tìm chi nhánh gần nhất
 * @param {Object} destination - {lat: number, lng: number, address: string}
 * @param {Array<Object>} branches - [{id, name, address, latitude, longitude}]
 * @returns {Object|null} Chi nhánh gần nhất hoặc null nếu không có
 */
function findNearestBranch(destination, branches) {
  const branchesWithDistance = calculateDistancesToBranches(
    destination,
    branches
  );

  if (branchesWithDistance.length === 0) {
    return null;
  }

  // Chi nhánh đầu tiên sau khi sắp xếp là gần nhất
  const nearest = branchesWithDistance[0];

  // Kiểm tra xem có hợp lệ không
  if (nearest.distance === Infinity) {
    return null;
  }

  return nearest;
}

/**
 * Tìm N chi nhánh gần nhất
 * @param {Object} destination - {lat: number, lng: number, address: string}
 * @param {Array<Object>} branches - [{id, name, address, latitude, longitude}]
 * @param {number} limit - Số lượng chi nhánh cần lấy
 * @returns {Array<Object>} Danh sách N chi nhánh gần nhất
 */
function findNearestBranches(destination, branches, limit = 5) {
  const branchesWithDistance = calculateDistancesToBranches(
    destination,
    branches
  );

  // Lọc bỏ các chi nhánh không có tọa độ và lấy N chi nhánh đầu tiên
  return branchesWithDistance
    .filter((b) => b.distance !== Infinity)
    .slice(0, limit);
}

module.exports = {
  calculateHaversineDistance,
  formatDistance,
  calculateDistancesToBranches,
  findNearestBranch,
  findNearestBranches,
};
