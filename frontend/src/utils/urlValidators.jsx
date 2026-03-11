/**
 * Utility to validate and sanitize URLs against unsafe protocols (like javascript:).
 * @param {string} url - The URL to validate
 * @param {string} fallback - The fallback URL if invalid
 * @returns {string} The original URL if safe, otherwise the fallback
 */
export const getSafeUrl = (url, fallback = '#') => {
    if (!url) return fallback;
    try {
        // If it's a relative URL, new URL will parse it against origin which is safe
        const parsed = new URL(url, window.location.origin);
        if (['http:', 'https:'].includes(parsed.protocol)) {
            return url;
        }
        return fallback;
    } catch (e) {
        // If it fails to parse completely, return fallback
        return fallback;
    }
};
