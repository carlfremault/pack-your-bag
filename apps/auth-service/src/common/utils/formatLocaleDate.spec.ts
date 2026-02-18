import { describe, expect, it } from 'vitest';

import { formatLocaleDate } from './formatLocaleDate';

describe('formatLocaleDate', () => {
  it('should format a valid date with the default locale (en-GB)', () => {
    const date = new Date('2026-02-18T10:00:00Z');
    const result = formatLocaleDate(date);

    expect(result).toContain('February');
    expect(result).toContain('2026');
  });

  it('should format a date according to a specific locale', () => {
    const date = new Date('2026-02-18T10:00:00Z');
    const result = formatLocaleDate(date, 'fr-FR');

    expect(result.toLowerCase()).toContain('février');
  });

  it('should throw an "Invalid date" error if an invalid Date object is provided', () => {
    const invalidDate = new Date('not-a-date');

    expect(() => formatLocaleDate(invalidDate)).toThrow('Invalid date provided');
  });
});
