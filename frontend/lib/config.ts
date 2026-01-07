export const API_GATEWAY_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export const SERVICES = {
  PRODUCT: "http://localhost:3004/api",
  CATEGORY: "http://localhost:3013/api",
  PROMOTION: "http://localhost:3016/api",
  REVIEW: "http://localhost:3007/api",
};
