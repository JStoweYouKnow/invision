// URL validation utilities for external links

// Whitelist of trusted domains for external links
const TRUSTED_DOMAINS = [
    'youtube.com',
    'www.youtube.com',
    'youtu.be',
    'github.com',
    'stackoverflow.com',
    'medium.com',
    'dev.to',
    'coursera.org',
    'www.coursera.org',
    'udemy.com',
    'www.udemy.com',
    'edx.org',
    'www.edx.org',
    'linkedin.com',
    'www.linkedin.com',
    'twitter.com',
    'x.com',
    'reddit.com',
    'www.reddit.com',
    'wikipedia.org',
    'en.wikipedia.org',
    'notion.so',
    'figma.com',
    'www.figma.com',
    'dribbble.com',
    'behance.net',
    'www.behance.net',
    'amazon.com',
    'www.amazon.com',
    'goodreads.com',
    'www.goodreads.com',
];

// Whitelist of trusted image sources
const TRUSTED_IMAGE_SOURCES = [
    'unsplash.com',
    'images.unsplash.com',
    'firebasestorage.googleapis.com',
];

/**
 * Validates if a URL is from a trusted domain
 */
export function isValidExternalUrl(url: string): boolean {
    if (!url) return false;

    try {
        const parsed = new URL(url);

        // Only allow http and https protocols
        if (!['http:', 'https:'].includes(parsed.protocol)) {
            return false;
        }

        // Check against trusted domains
        const hostname = parsed.hostname.toLowerCase();
        return TRUSTED_DOMAINS.some(domain =>
            hostname === domain || hostname.endsWith('.' + domain)
        );
    } catch {
        return false;
    }
}

/**
 * Validates if an image URL is from a trusted source
 */
export function isValidImageUrl(url: string): boolean {
    if (!url) return false;

    // Data URIs are considered safe (they're base64 encoded)
    if (url.startsWith('data:image/')) {
        return true;
    }

    try {
        const parsed = new URL(url);

        // Only allow http and https protocols
        if (!['http:', 'https:'].includes(parsed.protocol)) {
            return false;
        }

        // Check against trusted image sources
        const hostname = parsed.hostname.toLowerCase();
        return TRUSTED_IMAGE_SOURCES.some(domain =>
            hostname === domain || hostname.endsWith('.' + domain)
        );
    } catch {
        return false;
    }
}

/**
 * Safely extracts hostname from URL for display
 */
export function getSafeHostname(url: string): string {
    try {
        return new URL(url).hostname;
    } catch {
        return url;
    }
}

/**
 * Sanitizes a URL for safe usage in href attributes
 * Returns '#' if the URL is invalid or untrusted
 */
export function sanitizeExternalUrl(url: string): string {
    if (isValidExternalUrl(url)) {
        return url;
    }
    return '#';
}
