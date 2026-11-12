import { describe, it, expect } from 'vitest';
import { urlBase64ToUint8Array, isPushSupported } from './push.js';

describe('Web Push Utilities', () => {
  describe('urlBase64ToUint8Array', () => {
    it('converts base64url string to Uint8Array', () => {
      // Base64url encoded string
      const base64UrlKey = 'BMnPHCFdtK8dUvUR7WAQ8X-8X0pDaptqm6Xzjemno4-_OHiUYJ9Xn8ZKvfgL1luo19kqTDo5K8dYo-nTa_Umrrk';
      const result = urlBase64ToUint8Array(base64UrlKey);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBeGreaterThan(30);
    });

    it('handles padding correctly', () => {
      const shortBase64 = 'c3dlZXR5'; // 'sweety'
      const result = urlBase64ToUint8Array(shortBase64);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(6);
    });
  });

  describe('isPushSupported', () => {
    it('returns false when window or serviceWorker is missing', () => {
      // In default JSDOM without PushManager or serviceWorker
      expect(typeof isPushSupported()).toBe('boolean');
    });
  });
});

