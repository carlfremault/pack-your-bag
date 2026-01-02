import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name, { timestamp: true });
  private pool: Pool;

  constructor(configService: ConfigService) {
    const connectionString = configService.get<string>('AUTH_URL');

    if (!connectionString) {
      throw new Error('❌ Connection failed: AUTH_URL is missing in .env');
    }
    const poolInstance = new Pool({ connectionString });
    const adapter = new PrismaPg(poolInstance);
    super({ adapter });
    this.pool = poolInstance;
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database connection established');
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
    } finally {
      try {
        await this.pool.end();
      } catch (error) {
        this.logger.error(
          `Failed to end pool: ${error instanceof Error ? error.message : String(error)}`,
          error instanceof Error ? error.stack : undefined,
        );
      }
    }
  }
}
