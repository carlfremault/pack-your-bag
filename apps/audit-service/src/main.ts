import './instrument';

import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from './app.module';

async function bootstrap() {
  const nodeEnv = process.env.NODE_ENV;
  if (!nodeEnv || !['development', 'test', 'production'].includes(nodeEnv)) {
    console.error(
      `NODE_ENV must be explicitly set to 'development', 'test', or 'production'. ` +
        `Current value: "${nodeEnv}"`,
    );
    process.exit(1);
  }

  const isProduction = nodeEnv === 'production';

  // Logger setup
  const logLevels: ('log' | 'error' | 'warn' | 'debug' | 'verbose')[] = isProduction
    ? ['log', 'error', 'warn']
    : ['log', 'error', 'warn', 'debug'];

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: logLevels,
    bufferLogs: true,
  });

  // Graceful shutdown
  app.enableShutdownHooks();

  await app.listen(process.env.AUDIT_PORT ?? 8001);
}

bootstrap().catch((err) => {
  console.error('Failed to start Audit Service:', err);
  process.exit(1);
});
