import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

import { PrismaClient } from '@/generated/prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name, { timestamp: true });
  private readonly pool: Pool;

  constructor(configService: ConfigService) {
    const connectionString = configService.getOrThrow<string>('AUTH_URL');

    const poolInstance = new Pool({
      connectionString,
      max: configService.get<number>('AUTH_DB_POOL_MAX', 20),
      idleTimeoutMillis: configService.get<number>('AUTH_DB_IDLE_TIMEOUT', 30000),
      connectionTimeoutMillis: configService.get<number>('AUTH_DB_CONN_TIMEOUT', 5000),
    });

    const adapter = new PrismaPg(poolInstance);
    super({ adapter });
    this.pool = poolInstance;
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ Database connection established successfully');
    } catch (err) {
      this.logger.error('❌ Failed to connect to the database on init', err);
      throw err;
    }
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
