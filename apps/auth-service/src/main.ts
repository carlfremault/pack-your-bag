import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from './app.module';

async function bootstrap() {
  const logLevels: ('log' | 'error' | 'warn' | 'debug' | 'verbose')[] =
    process.env.NODE_ENV === 'production'
      ? ['log', 'error', 'warn']
      : ['log', 'error', 'warn', 'debug'];

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: logLevels,
  });
  app.set('trust proxy', 1);
  await app.listen(process.env.AUTH_PORT ?? 8001);
}
bootstrap().catch((err) => {
  console.error('Failed to start Auth Service:', err);
  process.exit(1);
});
