/**
 * Normalizes property images from various formats to a string array
 * Handles:
 * - Array format: ["https://..."]
 * - Object format: {"urls":["https://..."]}
 * - JSON string format: '["https://..."]' or '{"urls":["https://..."]}'
 */
export function normalizePropertyImages(images: any): string[] {
  if (!images) return [];
  
  // If it's already an array of strings, return it
  if (Array.isArray(images)) {
    return images.filter((img): img is string => typeof img === 'string' && img.length > 0);
  }
  
  // If it's a JSON string, parse it first
  if (typeof images === 'string') {
    const trimmed = images.trim();
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        images = JSON.parse(images);
      } catch (e) {
        console.warn('Failed to parse images JSON:', e);
        return [];
      }
    } else {
      // Single URL string
      return [images];
    }
  }
  
  // If it's an object with urls array: { urls: ["https://..."] }
  if (typeof images === 'object' && images.urls && Array.isArray(images.urls)) {
    return images.urls.filter((url: any): url is string => typeof url === 'string' && url.length > 0);
  }
  
  // If it's an object with other structure, try to extract URLs
  if (typeof images === 'object' && !Array.isArray(images)) {
    // Check for common patterns
    if (images.gallery && Array.isArray(images.gallery)) {
      return images.gallery.filter((img: any): img is string => typeof img === 'string' && img.length > 0);
    }
    
    // Try to find any array of strings in the object
    const values = Object.values(images);
    for (const val of values) {
      if (Array.isArray(val)) {
        const stringUrls = val.filter((item): item is string => typeof item === 'string' && item.length > 0);
        if (stringUrls.length > 0) {
          return stringUrls;
        }
      }
    }
  }
  
  return [];
}

