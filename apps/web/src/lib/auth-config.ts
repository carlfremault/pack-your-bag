export interface AuthConfig {
  bffSecret: string;
  authServiceUrl: string;
}

let cached: AuthConfig | undefined;

export function getAuthConfig(): AuthConfig {
  if (cached) return cached;

  const bffSecret = process.env.BFF_SHARED_SECRET;
  const authServiceUrl = process.env.AUTH_SERVICE_URL;

  if (!bffSecret) {
    throw new Error('BFF_SHARED_SECRET environment variable is required');
  }
  if (!authServiceUrl) {
    throw new Error('AUTH_SERVICE_URL environment variable is required');
  }

  cached = { bffSecret, authServiceUrl };
  return cached;
}
