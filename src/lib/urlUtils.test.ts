import { describe, it, expect } from 'vitest';
import { isValidExternalUrl, isValidImageUrl, getSafeHostname, sanitizeExternalUrl } from './urlUtils';

describe('URL Utilities', () => {
    describe('isValidExternalUrl', () => {
        it('should accept trusted HTTPS URLs', () => {
            expect(isValidExternalUrl('https://youtube.com/watch?v=abc')).toBe(true);
            expect(isValidExternalUrl('https://github.com/user/repo')).toBe(true);
            expect(isValidExternalUrl('https://stackoverflow.com/questions/123')).toBe(true);
            expect(isValidExternalUrl('https://www.coursera.org/learn/ml')).toBe(true);
        });

        it('should accept trusted HTTP URLs', () => {
            expect(isValidExternalUrl('http://youtube.com/watch?v=abc')).toBe(true);
        });

        it('should reject untrusted domains', () => {
            expect(isValidExternalUrl('https://evil.com/phish')).toBe(false);
            expect(isValidExternalUrl('https://malware.org')).toBe(false);
        });

        it('should reject non-http protocols', () => {
            expect(isValidExternalUrl('ftp://youtube.com')).toBe(false);
            expect(isValidExternalUrl('javascript:alert(1)')).toBe(false);
            expect(isValidExternalUrl('file:///etc/passwd')).toBe(false);
        });

        it('should reject empty or invalid input', () => {
            expect(isValidExternalUrl('')).toBe(false);
            expect(isValidExternalUrl('not a url')).toBe(false);
        });

        it('should accept subdomains of trusted domains', () => {
            expect(isValidExternalUrl('https://en.wikipedia.org/wiki/Test')).toBe(true);
        });
    });

    describe('isValidImageUrl', () => {
        it('should accept trusted image sources', () => {
            expect(isValidImageUrl('https://images.unsplash.com/photo-123')).toBe(true);
            expect(isValidImageUrl('https://firebasestorage.googleapis.com/v0/b/test')).toBe(true);
        });

        it('should accept data URIs for images', () => {
            expect(isValidImageUrl('data:image/png;base64,iVBORw0KGgo=')).toBe(true);
            expect(isValidImageUrl('data:image/jpeg;base64,/9j/4AAQ=')).toBe(true);
        });

        it('should reject untrusted image sources', () => {
            expect(isValidImageUrl('https://evil.com/image.png')).toBe(false);
        });

        it('should reject non-http protocols', () => {
            expect(isValidImageUrl('ftp://images.unsplash.com/photo')).toBe(false);
        });

        it('should reject empty or invalid input', () => {
            expect(isValidImageUrl('')).toBe(false);
            expect(isValidImageUrl('not a url')).toBe(false);
        });
    });

    describe('getSafeHostname', () => {
        it('should extract hostname from valid URLs', () => {
            expect(getSafeHostname('https://youtube.com/watch?v=123')).toBe('youtube.com');
            expect(getSafeHostname('https://www.github.com/user')).toBe('www.github.com');
        });

        it('should return the input for invalid URLs', () => {
            expect(getSafeHostname('not a url')).toBe('not a url');
            expect(getSafeHostname('')).toBe('');
        });
    });

    describe('sanitizeExternalUrl', () => {
        it('should return the URL if it is valid and trusted', () => {
            const url = 'https://github.com/vaydr/invision';
            expect(sanitizeExternalUrl(url)).toBe(url);
        });

        it('should return "#" for untrusted URLs', () => {
            expect(sanitizeExternalUrl('https://evil.com')).toBe('#');
        });

        it('should return "#" for invalid input', () => {
            expect(sanitizeExternalUrl('')).toBe('#');
            expect(sanitizeExternalUrl('javascript:alert(1)')).toBe('#');
        });
    });
});
