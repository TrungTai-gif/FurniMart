const axios = require("axios");

/**
 * TomTom Maps API Utils
 * Free tier: 2,500 requests/day
 * Docs: https://developer.tomtom.com/
 */

const TOMTOM_BASE_URL = "https://api.tomtom.com";

/**
 * Geocoding: Chuyển địa chỉ thành tọa độ (lat, lng)
 * @param {string} address - Địa chỉ cần geocode
 * @returns {Promise<{lat: number, lng: number, formattedAddress: string}>}
 */
async function geocodeAddressWithTomTom(address) {
  try {
    const apiKey = process.env.TOMTOM_API_KEY;

    if (!apiKey) {
      throw new Error("TOMTOM_API_KEY is not configured");
    }

    const response = await axios.get(`${TOMTOM_BASE_URL}/search/2/geocode/${encodeURIComponent(address)}.json`, {
      params: {
        key: apiKey,
        language: "vi-VN",
        limit: 1,
      },
    });

    if (!response.data.results || response.data.results.length === 0) {
      throw new Error("Cannot geocode address with TomTom");
    }

    const result = response.data.results[0];

    return {
      lat: result.position.lat,
      lng: result.position.lon,
      formattedAddress: result.address.freeformAddress,
    };
  } catch (error) {
    console.error("❌ Error geocoding with TomTom:", error.message);
    throw error;
  }
}

/**
 * Tính khoảng cách giữa 2 điểm sử dụng TomTom Routing API
 * @param {string} origin - Địa chỉ xuất phát
 * @param {string} destination - Địa chỉ đích
 * @returns {Promise<{distance: number, duration: number, distanceText: string, durationText: string}>}
 */
async function calculateDistanceWithTomTom(origin, destination) {
  try {
    const apiKey = process.env.TOMTOM_API_KEY;

    if (!apiKey) {
      throw new Error("TOMTOM_API_KEY is not configured");
    }

    // Bước 1: Geocode origin và destination
    const [originGeo, destGeo] = await Promise.all([
      geocodeAddressWithTomTom(origin),
      geocodeAddressWithTomTom(destination),
    ]);

    // Bước 2: Tính route giữa 2 điểm
    const routeUrl = `${TOMTOM_BASE_URL}/routing/1/calculateRoute/${originGeo.lat},${originGeo.lng}:${destGeo.lat},${destGeo.lng}/json`;

    const response = await axios.get(routeUrl, {
      params: {
        key: apiKey,
        traffic: false,
        travelMode: "car",
        language: "vi-VN",
      },
    });

    if (!response.data.routes || response.data.routes.length === 0) {
      throw new Error("Cannot calculate route with TomTom");
    }

    const route = response.data.routes[0];
    const summary = route.summary;

    return {
      distance: summary.lengthInMeters, // mét
      duration: summary.travelTimeInSeconds, // giây
      distanceText: `${(summary.lengthInMeters / 1000).toFixed(1)} km`,
      durationText: `${Math.ceil(summary.travelTimeInSeconds / 60)} phút`,
    };
  } catch (error) {
    console.error("❌ Error calculating distance with TomTom:", error.message);
    throw error;
  }
}

/**
 * Tính khoảng cách từ một địa chỉ đến nhiều chi nhánh sử dụng TomTom
 * @param {string} destination - Địa chỉ giao hàng
 * @param {Array<{id: string, name: string, address: string}>} branches - Danh sách chi nhánh
 * @returns {Promise<Array<{branchId: string, distance: number, duration: number}>>}
 */
async function calculateDistanceToBranchesWithTomTom(destination, branches) {
  try {
    const apiKey = process.env.TOMTOM_API_KEY;

    if (!apiKey) {
      throw new Error("TOMTOM_API_KEY is not configured");
    }

    // Tính khoảng cách song song cho tất cả chi nhánh
    const results = await Promise.all(
      branches.map(async (branch) => {
        try {
          const distanceData = await calculateDistanceWithTomTom(branch.address, destination);

          return {
            branchId: branch.id,
            branchName: branch.name,
            address: branch.address,
            distance: distanceData.distance,
            duration: distanceData.duration,
            distanceText: distanceData.distanceText,
            durationText: distanceData.durationText,
          };
        } catch (error) {
          return {
            branchId: branch.id,
            branchName: branch.name,
            address: branch.address,
            distance: Infinity,
            duration: Infinity,
            distanceText: "N/A",
            durationText: "N/A",
            error: error.message,
          };
        }
      })
    );

    // Sắp xếp theo khoảng cách gần nhất
    return results.sort((a, b) => a.distance - b.distance);
  } catch (error) {
    console.error("❌ Error calculating distances to branches with TomTom:", error.message);
    throw error;
  }
}

module.exports = {
  geocodeAddressWithTomTom,
  calculateDistanceWithTomTom,
  calculateDistanceToBranchesWithTomTom,
};
