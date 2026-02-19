import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  DiskHealthIndicator,
  HealthCheck,
  HealthCheckResult,
  HealthCheckService,
  MemoryHealthIndicator,
  PrismaHealthIndicator,
} from '@nestjs/terminus';

import { PrismaService } from '@/prisma/prisma.service';

@ApiTags('health')
@ApiResponse({
  status: 503,
  description: 'One or more health indicators failed (database, disk, or memory).',
})
@Controller('health')
export class HealthController {
  private readonly storagePath: string;

  constructor(
    private readonly health: HealthCheckService,
    private readonly db: PrismaHealthIndicator,
    private readonly prisma: PrismaService,
    private readonly disk: DiskHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
    private readonly configService: ConfigService,
  ) {
    this.storagePath = this.configService.get<string>('AUTH_STORAGE_PATH', '/');
  }

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Check service health (database, disk, memory)' })
  @ApiResponse({ status: 200, description: 'All health indicators passing.' })
  check(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.db.pingCheck('database', this.prisma),
      () => this.disk.checkStorage('storage', { path: this.storagePath, thresholdPercent: 0.8 }), // 80%
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024), // 300MB
    ]);
  }
}
