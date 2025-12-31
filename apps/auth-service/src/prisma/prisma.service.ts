import { Pool } from 'pg';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
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
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
    } finally {
      await this.pool.end();
    }
  }
}
