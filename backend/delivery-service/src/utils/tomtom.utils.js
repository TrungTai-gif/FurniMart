// utils/tomtom.utils.js
const axios = require("axios");

const TOMTOM_API_KEY = process.env.TOMTOM_API_KEY;

if (!TOMTOM_API_KEY) {
  throw new Error(
    "TOMTOM_API_KEY không được định nghĩa trong file .env. " +
      "Vui lòng thêm TOMTOM_API_KEY vào .env trước khi sử dụng."
  );
}

const TOMTOM_BASE_URL = "https://api.tomtom.com";

/**
 * Geocode địa chỉ thành tọa độ (latitude, longitude)
 * @param {string} address - Địa chỉ cần tìm tọa độ
 * @returns {Promise<{latitude: number, longitude: number, formattedAddress: string, country: string, city: string, district: string}>}
 */
const geocodeAddress = async (address) => {
  if (!address || typeof address !== "string") {
    throw new Error("Địa chỉ không hợp lệ");
  }

  try {
    const url = `${TOMTOM_BASE_URL}/search/2/geocode/${encodeURIComponent(
      address
    )}.json`;

    const { data } = await axios.get(url, {
      params: {
        key: TOMTOM_API_KEY,
        limit: 1,
        language: "vi-VN", // Ngôn ngữ trả về (có thể thay đổi)
      },
      timeout: 10000, // 10 giây timeout
    });

    if (!data.results?.length) {
      throw new Error("Không tìm thấy địa chỉ");
    }

    const result = data.results[0];

    return {
      latitude: result.position.lat,
      longitude: result.position.lon,
      formattedAddress: result.address.freeformAddress,
      country: result.address.country || "",
      city: result.address.municipality || "",
      district: result.address.municipalitySubdivision || "",
    };
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      if (status === 401 || status === 403) {
        throw new Error("API Key TomTom không hợp lệ hoặc hết hạn");
      }
      if (status === 429) {
        throw new Error("Vượt quá giới hạn request của TomTom API");
      }
    }
    console.error("Lỗi geocode:", error.message);
    throw new Error(`Không thể geocode địa chỉ: ${error.message}`);
  }
};

/**
 * Tính toán lộ trình giữa 2 điểm
 * @param {number} startLat - Vĩ độ điểm xuất phát
 * @param {number} startLon - Kinh độ điểm xuất phát
 * @param {number} endLat - Vĩ độ điểm đến
 * @param {number} endLon - Kinh độ điểm đến
 * @param {string} [travelMode="car"] - Phương tiện (car, truck, pedestrian, ...)
 * @returns {Promise<{distance: number, travelTime: number, trafficDelay: number, geometry: Array, instructions: Array}>}
 */
const calculateRoute = async (
  startLat,
  startLon,
  endLat,
  endLon,
  travelMode = "car"
) => {
  try {
    const url = `${TOMTOM_BASE_URL}/routing/1/calculateRoute/${startLat},${startLon}:${endLat},${endLon}/json`;

    const { data } = await axios.get(url, {
      params: {
        key: TOMTOM_API_KEY,
        travelMode,
        routeType: "fastest",
        traffic: true,
        computeTravelTimeFor: "all",
        instructionsType: "text",
      },
      timeout: 15000,
    });

    if (!data.routes?.length) {
      throw new Error("Không tìm thấy lộ trình");
    }

    const route = data.routes[0];
    const summary = route.summary;

    return {
      distance: summary.lengthInMeters / 1000, // chuyển sang km
      travelTime: summary.travelTimeInSeconds / 60, // chuyển sang phút
      trafficDelay: (summary.trafficDelayInSeconds || 0) / 60, // phút
      geometry: route.legs?.[0]?.points || [], // mảng điểm tọa độ
      instructions: route.guidance?.instructions || [],
    };
  } catch (error) {
    console.error("Lỗi tính lộ trình:", error.message);
    throw new Error(`Không thể tính lộ trình: ${error.message}`);
  }
};

/**
 * Reverse Geocode - Lấy địa chỉ từ tọa độ
 * @param {number} lat - Vĩ độ
 * @param {number} lon - Kinh độ
 * @returns {Promise<{formattedAddress: string, country: string, city: string, district: string, streetName: string, streetNumber: string}>}
 */
const reverseGeocode = async (lat, lon) => {
  try {
    const url = `${TOMTOM_BASE_URL}/search/2/reverseGeocode/${lat},${lon}.json`;

    const { data } = await axios.get(url, {
      params: {
        key: TOMTOM_API_KEY,
        language: "vi-VN",
        returnRoadUse: false,
        returnSpeedLimit: false,
      },
      timeout: 8000,
    });

    if (!data.addresses?.length) {
      throw new Error("Không tìm thấy địa chỉ cho tọa độ này");
    }

    const address = data.addresses[0].address;

    return {
      formattedAddress: address.freeformAddress,
      country: address.country || "",
      city: address.municipality || "",
      district: address.municipalitySubdivision || "",
      streetName: address.streetName || "",
      streetNumber: address.streetNumber || "",
    };
  } catch (error) {
    console.error("Lỗi reverse geocode:", error.message);
    throw new Error(`Không thể reverse geocode: ${error.message}`);
  }
};

/**
 * Tính ma trận khoảng cách & thời gian giữa nhiều điểm (nếu cần dùng sau này)
 * @param {Array<{lat: number, lon: number}>} locations - Danh sách tọa độ
 * @param {string} [travelMode="car"]
 * @returns {Promise<any>}
 */
const calculateMatrix = async (locations, travelMode = "car") => {
  if (locations.length < 2) {
    throw new Error("Cần ít nhất 2 điểm để tính ma trận");
  }

  try {
    const url = `${TOMTOM_BASE_URL}/routing/1/matrix/json`;

    const { data } = await axios.post(
      url,
      {
        origins: {
          type: "MultiPoint",
          coordinates: locations.map((loc) => [loc.lon, loc.lat]),
        },
        destinations: {
          type: "MultiPoint",
          coordinates: locations.map((loc) => [loc.lon, loc.lat]),
        },
      },
      {
        params: {
          key: TOMTOM_API_KEY,
          travelMode,
          routeType: "fastest",
        },
        timeout: 20000,
      }
    );

    return data.matrix;
  } catch (error) {
    console.error("Lỗi tính matrix:", error.message);
    throw new Error("Không thể tính ma trận khoảng cách");
  }
};

module.exports = {
  geocodeAddress,
  calculateRoute,
  reverseGeocode,
  calculateMatrix,
};
