export interface UserDataConfig {
  bffSecret: string;
  userDataServiceUrl: string;
}

let cached: UserDataConfig | undefined;

export function getUserDataConfig(): UserDataConfig {
  if (cached) return cached;

  const bffSecret = process.env.BFF_SHARED_SECRET;
  const userDataServiceUrl = process.env.USER_DATA_SERVICE_URL;

  if (!bffSecret) {
    throw new Error('BFF_SHARED_SECRET environment variable is required');
  }
  if (!userDataServiceUrl) {
    throw new Error('USER_DATA_SERVICE_URL environment variable is required');
  }

  cached = { bffSecret, userDataServiceUrl };
  return cached;
}
