/**
 * Stringify a value safely
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
