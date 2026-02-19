/**
 * Stringify a value safely, with fallback handling.
 * Attempts JSON.stringify with 2-space indentation; if that fails
 * (e.g., circular references, BigInt), falls back to String(value).
 *
 * @param value The value to stringify
 * @returns The stringified value
 */
export function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}
