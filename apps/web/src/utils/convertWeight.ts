const GRAMS_PER_OUNCE = 28.3495;

export function convertGramsToOunces(grams: number): number {
  const ounces = grams / GRAMS_PER_OUNCE;
  return Math.round((ounces + Number.EPSILON) * 100) / 100;
}

export function convertOuncesToGrams(ounces: number): number {
  return ounces * GRAMS_PER_OUNCE;
}
