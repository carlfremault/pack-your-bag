import { Units } from '@repo/constants';

const GRAMS_PER_OUNCE = 28.3495;
const GRAMS_PER_POUND = 453.59237;
const LARGE_UNIT_THRESHOLD = 1000;

export function convertGramsToOunces(grams: number): number {
  return parseFloat((grams / GRAMS_PER_OUNCE).toFixed(2));
}

export function convertOuncesToGrams(ounces: number): number {
  return ounces * GRAMS_PER_OUNCE;
}

export function getWeightUnit(units?: string) {
  return units ? (units === Units.METRIC ? 'g' : 'oz') : '';
}

export function formatWeightForDisplay(
  grams: number,
  units?: string,
): { value: string; unit: string } {
  if (!units) return { value: String(grams), unit: '' };

  if (units === Units.METRIC) {
    return grams >= LARGE_UNIT_THRESHOLD
      ? { value: (grams / 1000).toFixed(2), unit: 'kg' }
      : { value: String(grams), unit: 'g' };
  }

  return grams >= GRAMS_PER_POUND
    ? { value: (grams / GRAMS_PER_POUND).toFixed(2), unit: 'lbs' }
    : { value: String(convertGramsToOunces(grams)), unit: 'oz' };
}
