export interface ProductConfig {
  bffSecret: string;
  productServiceUrl: string;
}

let cached: ProductConfig | undefined;

export function getProductConfig(): ProductConfig {
  if (cached) return cached;

  const bffSecret = process.env.BFF_SHARED_SECRET;
  const productServiceUrl = process.env.PRODUCT_SERVICE_URL;

  if (!bffSecret) {
    throw new Error('BFF_SHARED_SECRET environment variable is required');
  }
  if (!productServiceUrl) {
    throw new Error('PRODUCT_SERVICE_URL environment variable is required');
  }

  cached = { bffSecret, productServiceUrl };
  return cached;
}
