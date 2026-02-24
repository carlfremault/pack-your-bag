import { describe, expect, it } from 'vitest';

import { anonymizeEmail } from './anonymizeEmail';

describe('anonymizeEmail', () => {
  describe('invalid inputs', () => {
    it('should return invalid-email for an empty string', () => {
      expect(anonymizeEmail('')).toBe('invalid-email');
    });

    it('should return invalid-email when there is no @ symbol', () => {
      expect(anonymizeEmail('notanemail')).toBe('invalid-email');
    });

    it('should return invalid-email when the local part is empty (starts with @)', () => {
      expect(anonymizeEmail('@domain.com')).toBe('invalid-email');
    });

    it('should return invalid-email when the domain is empty (ends with @)', () => {
      expect(anonymizeEmail('user@')).toBe('invalid-email');
    });

    it('should return invalid-email when domain contains a second @ (malformed)', () => {
      expect(anonymizeEmail('user@do@main.com')).toBe('invalid-email');
    });
  });

  describe('short local parts (length <= 3)', () => {
    it('should show only the first character for a 1-char local part', () => {
      expect(anonymizeEmail('a@example.com')).toBe('a***@example.com');
    });

    it('should show only the first character for a 2-char local part', () => {
      expect(anonymizeEmail('ab@example.com')).toBe('a***@example.com');
    });
    it('should show only the first character for a 3-char local part', () => {
      expect(anonymizeEmail('abc@example.com')).toBe('a***@example.com');
    });
  });

  describe('standard local parts (length > 3)', () => {
    it('should show first 2 chars, ***, last char for a 4-char local part', () => {
      expect(anonymizeEmail('abcd@example.com')).toBe('ab***d@example.com');
    });

    it('should correctly anonymize a typical email', () => {
      expect(anonymizeEmail('john.doe@example.com')).toBe('jo***e@example.com');
    });

    it('should correctly anonymize a longer local part', () => {
      expect(anonymizeEmail('verylongemail@domain.org')).toBe('ve***l@domain.org');
    });
  });

  describe('special characters in local part', () => {
    it('should handle dots in the local part', () => {
      expect(anonymizeEmail('john.doe.smith@example.com')).toBe('jo***h@example.com');
    });

    it('should handle plus addressing', () => {
      expect(anonymizeEmail('user+tag@example.com')).toBe('us***g@example.com');
    });
  });

  describe('domain preservation', () => {
    it('should preserve subdomains in the domain part', () => {
      expect(anonymizeEmail('user@mail.company.co.uk')).toBe('us***r@mail.company.co.uk');
    });
  });
});
