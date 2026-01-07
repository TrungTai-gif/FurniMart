/**
 * Image URL normalization utilities
 * Converts various image URL formats to proper API endpoints
 */

/**
 * Parse image URL to extract folder and filename
 * @param imageUrl - Image URL from database or API response
 * @returns { folder, filename } or null if invalid
 */
export function parseImageUrl(
  imageUrl: string | null | undefined
): { folder: string; filename: string } | null {
  if (!imageUrl) return null;

  // Match patterns like: /images/products/uuid.jpg, /images/hero/uuid.png, etc.
  const match = imageUrl.match(/\/images\/([^/]+)\/(.+)$/);
  if (match) {
    const [, folder, filename] = match;
    return { folder, filename };
  }

  // If it's just a filename (from older format), try to guess folder
  if (!imageUrl.includes("/")) {
    // Could be from any folder - try products first as fallback
    return { folder: "products", filename: imageUrl };
  }

  return null;
}

/**
 * Convert image URL to API endpoint
 * Handles multiple URL formats and converts them to the new GET endpoint
 *
 * @param imageUrl - Image URL (e.g., "/images/products/uuid.jpg", "http://example.com/images/products/uuid.jpg")
 * @returns Proper API endpoint or original URL if invalid
 *
 * @example
 * normalizeImageUrl("/images/products/abc123.jpg")
 * // => "/api/upload/products/abc123.jpg"
 *
 * normalizeImageUrl("http://localhost:3001/images/hero/xyz789.png")
 * // => "/api/upload/hero/xyz789.png"
 */
export function normalizeImageUrl(
  imageUrl: string | null | undefined
): string | null {
  if (!imageUrl) return null;

  // Remove http:// or https:// and domain
  let cleaned = imageUrl;
  if (cleaned.startsWith("http")) {
    const urlMatch = cleaned.match(/https?:\/\/[^/]+(.+)$/);
    if (urlMatch) {
      cleaned = urlMatch[1];
    }
  }

  // Try to parse the image URL
  const parsed = parseImageUrl(cleaned);
  if (parsed) {
    return `/api/upload/${parsed.folder}/${parsed.filename}`;
  }

  // If it's already an API endpoint, return as-is
  if (imageUrl.startsWith("/api/upload/")) {
    return imageUrl;
  }

  // If it's a public image path, return as-is
  if (imageUrl.startsWith("/images/")) {
    // Try converting to API endpoint
    const parsed = parseImageUrl(imageUrl);
    if (parsed) {
      return `/api/upload/${parsed.folder}/${parsed.filename}`;
    }
  }

  // Fallback: return original URL
  return imageUrl;
}

/**
 * Get folder name from image URL
 */
export function getImageFolder(
  imageUrl: string | null | undefined
): string | null {
  const parsed = parseImageUrl(imageUrl);
  return parsed?.folder || null;
}

/**
 * Get filename from image URL
 */
export function getImageFilename(
  imageUrl: string | null | undefined
): string | null {
  const parsed = parseImageUrl(imageUrl);
  return parsed?.filename || null;
}
