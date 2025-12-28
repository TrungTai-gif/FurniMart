const { Client } = require("@googlemaps/google-maps-services-js");

const googleMapsClient = new Client({});

/**
 * Tính khoảng cách giữa địa chỉ giao hàng và chi nhánh
 * @param {string} origin - Địa chỉ xuất phát (chi nhánh)
 * @param {string} destination - Địa chỉ đích (giao hàng)
 * @returns {Promise<{distance: number, duration: number, distanceText: string, durationText: string}>}
 */
async function calculateDistance(origin, destination) {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      throw new Error("GOOGLE_MAPS_API_KEY is not configured");
    }

    const response = await googleMapsClient.distancematrix({
      params: {
        origins: [origin],
        destinations: [destination],
        key: apiKey,
        mode: "driving", // driving, walking, bicycling, transit
        language: "vi", // Tiếng Việt
        units: "metric", // metric hoặc imperial
      },
    });

    if (response.data.status !== "OK") {
      throw new Error(`Google Maps API error: ${response.data.status}`);
    }

    const element = response.data.rows[0].elements[0];

    if (element.status !== "OK") {
      throw new Error(`Cannot calculate distance: ${element.status}`);
    }

    return {
      distance: element.distance.value, // Khoảng cách tính bằng mét
      duration: element.duration.value, // Thời gian tính bằng giây
      distanceText: element.distance.text, // Ví dụ: "5.2 km"
      durationText: element.duration.text, // Ví dụ: "15 phút"
    };
  } catch (error) {
    console.error("❌ Error calculating distance:", error.message);
    throw error;
  }
}

/**
 * Tính khoảng cách từ một địa chỉ đến nhiều chi nhánh
 * @param {string} destination - Địa chỉ giao hàng
 * @param {Array<{id: string, address: string}>} branches - Danh sách chi nhánh
 * @returns {Promise<Array<{branchId: string, distance: number, duration: number, distanceText: string, durationText: string}>>}
 */
async function calculateDistanceToBranches(destination, branches) {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      throw new Error("GOOGLE_MAPS_API_KEY is not configured");
    }

    // Lấy địa chỉ của tất cả chi nhánh
    const origins = branches.map((b) => b.address);

    const response = await googleMapsClient.distancematrix({
      params: {
        origins: origins,
        destinations: [destination],
        key: apiKey,
        mode: "driving",
        language: "vi",
        units: "metric",
      },
    });

    if (response.data.status !== "OK") {
      throw new Error(`Google Maps API error: ${response.data.status}`);
    }

    // Map kết quả với từng chi nhánh
    const results = response.data.rows.map((row, index) => {
      const element = row.elements[0];
      
      if (element.status !== "OK") {
        return {
          branchId: branches[index].id,
          branchName: branches[index].name,
          address: branches[index].address,
          distance: Infinity, // Không tính được khoảng cách
          duration: Infinity,
          distanceText: "N/A",
          durationText: "N/A",
          error: element.status,
        };
      }

      return {
        branchId: branches[index].id,
        branchName: branches[index].name,
        address: branches[index].address,
        distance: element.distance.value, // mét
        duration: element.duration.value, // giây
        distanceText: element.distance.text,
        durationText: element.duration.text,
      };
    });

    // Sắp xếp theo khoảng cách gần nhất
    return results.sort((a, b) => a.distance - b.distance);
  } catch (error) {
    console.error("❌ Error calculating distances to branches:", error.message);
    throw error;
  }
}

/**
 * Geocoding: Chuyển địa chỉ thành tọa độ (lat, lng)
 * @param {string} address - Địa chỉ cần geocode
 * @returns {Promise<{lat: number, lng: number, formattedAddress: string}>}
 */
async function geocodeAddressWithGoogle(address) {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      throw new Error("GOOGLE_MAPS_API_KEY is not configured");
    }

    const response = await googleMapsClient.geocode({
      params: {
        address: address,
        key: apiKey,
        language: "vi",
      },
    });

    if (response.data.status !== "OK" || response.data.results.length === 0) {
      throw new Error(`Cannot geocode address: ${response.data.status}`);
    }

    const result = response.data.results[0];

    return {
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
      formattedAddress: result.formatted_address,
    };
  } catch (error) {
    console.error("❌ Error geocoding with Google Maps:", error.message);
    throw error;
  }
}

/**
 * Geocoding thông minh - Tự động chọn provider
 * Hỗ trợ: TomTom, Google Maps, Nominatim
 * @param {string} address - Địa chỉ cần geocode
 * @returns {Promise<{lat: number, lng: number, formattedAddress: string}>}
 */
async function geocodeAddress(address) {
  const mapProvider = process.env.MAP_PROVIDER || "nominatim"; // tomtom | google | nominatim
  const hasTomTomKey = !!process.env.TOMTOM_API_KEY;
  const hasGoogleApiKey = !!process.env.GOOGLE_MAPS_API_KEY;

  try {
    // TomTom Maps (ưu tiên nếu có key)
    if (mapProvider === "tomtom" && hasTomTomKey) {
      console.log("🗺️ Geocoding với TomTom Maps...");
      const { geocodeAddressWithTomTom } = require("./tomtom.utils");
      return await geocodeAddressWithTomTom(address);
    }
    
    // Google Maps
    if (mapProvider === "google" && hasGoogleApiKey) {
      console.log("🗺️ Geocoding với Google Maps...");
      return await geocodeAddressWithGoogle(address);
    }
    
    // Nominatim (mặc định - miễn phí)
    console.log("🗺️ Geocoding với Nominatim (OpenStreetMap - FREE)...");
    return await geocodeAddressWithNominatim(address);
  } catch (error) {
    // Fallback: Nếu provider chính lỗi, thử provider khác
    console.warn("⚠️ Geocoding provider chính lỗi, thử fallback...");
    
    if (mapProvider !== "nominatim") {
      console.log("🔄 Fallback sang Nominatim...");
      return await geocodeAddressWithNominatim(address);
    } else if (hasTomTomKey) {
      console.log("🔄 Fallback sang TomTom...");
      const { geocodeAddressWithTomTom } = require("./tomtom.utils");
      return await geocodeAddressWithTomTom(address);
    } else if (hasGoogleApiKey) {
      console.log("🔄 Fallback sang Google Maps...");
      return await geocodeAddressWithGoogle(address);
    }
    
    throw error;
  }
}

module.exports = {
  calculateDistance,
  calculateDistanceToBranches,
  geocodeAddress,
  geocodeAddressWithNominatim,
  geocodeAddressWithGoogle,
};
