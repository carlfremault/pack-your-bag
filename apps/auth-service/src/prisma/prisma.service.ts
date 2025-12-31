import { PrismaClient } from '@/generated/prisma/client';
import { Injectable } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    const connectionString = process.env.AUTH_URL;

    if (!connectionString) {
      throw new Error('❌ Connection failed: AUTH_URL is missing in .env');
    }

    const adapter = new PrismaPg({ connectionString });
    super({ adapter });
  }
}
