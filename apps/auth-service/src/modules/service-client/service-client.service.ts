import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ProductCleanupResult {
  deletedItems: number;
  deletedCategories: number;
  deletedLists: number;
  deletedPacks: number;
  deletedTrips: number;
}

export interface UserDataCleanupResult {
  deletedPreferences: number;
}

const REQUEST_TIMEOUT_MS = 30_000;

@Injectable()
export class ServiceClientService {
  private readonly logger = new Logger(ServiceClientService.name);
  private readonly productServiceUrl: string;
  private readonly userDataServiceUrl: string;
  private readonly internalSecret: string;

  constructor(private readonly configService: ConfigService) {
    this.productServiceUrl = this.configService.getOrThrow('PRODUCT_SERVICE_URL');
    this.userDataServiceUrl = this.configService.getOrThrow('USER_DATA_SERVICE_URL');
    this.internalSecret = this.configService.getOrThrow('INTERNAL_SERVICE_SECRET');
  }

  async cleanupProductData(userIds: string[]): Promise<ProductCleanupResult> {
    const url = `${this.productServiceUrl}/internal/cleanup/users`;
    this.logger.log(`Calling product-service cleanup for ${userIds.length} user(s)`);
    return this.postInternal<ProductCleanupResult>(url, { userIds });
  }

  async cleanupUserData(userIds: string[]): Promise<UserDataCleanupResult> {
    const url = `${this.userDataServiceUrl}/internal/cleanup/users`;
    this.logger.log(`Calling user-data-service cleanup for ${userIds.length} user(s)`);
    return this.postInternal<UserDataCleanupResult>(url, { userIds });
  }

  private async postInternal<T>(url: string, body: Record<string, unknown>): Promise<T> {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': this.internalSecret,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => 'unknown');
      throw new Error(`Internal request to ${url} failed with status ${response.status}: ${body}`);
    }

    return response.json() as Promise<T>;
  }
}
