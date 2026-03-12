import { describe, expect, it } from 'vitest';

import { anonymizeIp } from './anonymizeIp';

describe('anonymizeIp', () => {
  describe('missing or empty input', () => {
    it('should return 0.0.0.0 when ip is undefined', () => {
      expect(anonymizeIp(undefined)).toBe('0.0.0.0');
    });

    it('should return 0.0.0.0 when ip is an empty string', () => {
      expect(anonymizeIp('')).toBe('0.0.0.0');
    });
  });

  describe('IPv4', () => {
    it('should zero out the last octet', () => {
      expect(anonymizeIp('192.168.1.45')).toBe('192.168.1.0');
    });

    it('should handle single-digit last octet', () => {
      expect(anonymizeIp('10.0.0.1')).toBe('10.0.0.0');
    });

    it('should handle already-zeroed last octet', () => {
      expect(anonymizeIp('172.16.0.0')).toBe('172.16.0.0');
    });

    it('should handle max value last octet', () => {
      expect(anonymizeIp('255.255.255.255')).toBe('255.255.255.0');
    });
  });

  describe('IPv4-mapped IPv6 (::ffff:x.x.x.x)', () => {
    it('should anonymize the IPv4 portion and preserve the ::ffff: prefix', () => {
      expect(anonymizeIp('::ffff:192.168.1.1')).toBe('::ffff:192.168.1.0');
    });

    it('should handle uppercase ::ffff:', () => {
      // The code lowercases before checking, so this should still work
      expect(anonymizeIp('::FFFF:10.0.0.5')).toBe('::ffff:10.0.0.0');
    });

    it('should anonymize the last IPv4 octet when mapped', () => {
      expect(anonymizeIp('::ffff:203.0.113.99')).toBe('::ffff:203.0.113.0');
    });
  });

  describe('Standard IPv6 - full (uncompressed)', () => {
    it('should keep the first 3 groups and zero the rest', () => {
      expect(anonymizeIp('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe('2001:0db8:85a3::');
    });

    it('should handle all-zero IPv6', () => {
      expect(anonymizeIp('0000:0000:0000:0000:0000:0000:0000:0000')).toBe('0000:0000:0000::');
    });
  });

  describe('Standard IPv6 - compressed (with ::)', () => {
    it('should handle :: (all zeros)', () => {
      expect(anonymizeIp('::')).toBe('0:0:0::');
    });

    it('should handle leading groups with compression', () => {
      // e.g. 2001:db8:: expands to 2001:db8:0:0:0:0:0:0
      expect(anonymizeIp('2001:db8::')).toBe('2001:db8:0::');
    });

    it('should handle right-side compression only (::1 - loopback)', () => {
      // ::1 expands to 0:0:0:0:0:0:0:1
      expect(anonymizeIp('::1')).toBe('0:0:0::');
    });

    it('should handle compression in the middle', () => {
      // fe80::1 expands to fe80:0:0:0:0:0:0:1
      expect(anonymizeIp('fe80::1')).toBe('fe80:0:0::');
    });

    it('should handle a compressed address with enough left groups', () => {
      // 2001:db8:85a3::8a2e:370:7334 expands to 2001:db8:85a3:0:0:8a2e:370:7334
      expect(anonymizeIp('2001:db8:85a3::8a2e:370:7334')).toBe('2001:db8:85a3::');
    });
  });

  describe('IPv6 - invalid / edge cases', () => {
    it('should return :: when expandIPv6 returns null (multiple :: separators)', () => {
      // More than one :: is invalid IPv6 - expandIPv6 returns null
      expect(anonymizeIp('2001::db8::1')).toBe('::');
    });

    it('should return :: for an uncompressed address that does not have 8 groups', () => {
      // e.g. only 5 groups, no :: - expandIPv6 returns null
      expect(anonymizeIp('2001:db8:85a3:0:0')).toBe('::');
    });
  });
});
