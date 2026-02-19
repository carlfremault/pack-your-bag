import { describe, expect, it } from 'vitest';

import { safeStringify } from './safeStringify';

describe('safeStringify', () => {
  describe('successful serialization', () => {
    it('should stringify a plain object with indentation', () => {
      const result = safeStringify({ key: 'value' });
      expect(result).toBe(JSON.stringify({ key: 'value' }, null, 2));
    });

    it('should stringify an array', () => {
      const result = safeStringify([1, 2, 3]);
      expect(result).toBe(JSON.stringify([1, 2, 3], null, 2));
    });

    it('should stringify a string value', () => {
      expect(safeStringify('hello')).toBe('"hello"');
    });

    it('should stringify a number', () => {
      expect(safeStringify(42)).toBe('42');
    });

    it('should stringify null', () => {
      expect(safeStringify(null)).toBe('null');
    });

    it('should stringify a boolean', () => {
      expect(safeStringify(true)).toBe('true');
    });

    it('should stringify a nested object', () => {
      const obj = { user: { id: 1, name: 'Alice' }, active: true };
      expect(safeStringify(obj)).toBe(JSON.stringify(obj, null, 2));
    });
  });

  describe('fallback on serialization error', () => {
    it('should fall back to String() for circular references', () => {
      const circular: Record<string, unknown> = {};
      circular['self'] = circular;

      // JSON.stringify throws on circular references
      const result = safeStringify(circular);

      // String([object Object]) is the fallback
      expect(result).toBe('[object Object]');
    });

    it('should fall back gracefully for objects with a throwing toJSON', () => {
      const bad = {
        toJSON() {
          throw new Error('Cannot serialize');
        },
        toString() {
          return 'bad-object';
        },
      };

      const result = safeStringify(bad);
      expect(result).toBe('bad-object');
    });
  });
});
