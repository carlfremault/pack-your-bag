import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';

import helmet from 'helmet';

import { AppModule } from './app.module';

async function bootstrap() {
  const isProduction = process.env.NODE_ENV === 'production';

  const logLevels: ('log' | 'error' | 'warn' | 'debug' | 'verbose')[] = isProduction
    ? ['log', 'error', 'warn']
    : ['log', 'error', 'warn', 'debug'];

  const origins = process.env.ALLOWED_ORIGINS?.split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: logLevels,
  });

  app.set('trust proxy', 1);

  app.use(
    helmet({
      hsts: isProduction
        ? {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true,
          }
        : false,

      contentSecurityPolicy: isProduction
        ? {
            directives: {
              'default-src': ["'none'"],
              'base-uri': ["'self'"],
              'font-src': ["'self'", 'https:', 'data:'],
              'frame-ancestors': ["'none'"],
              'img-src': ["'self'", 'data:'],
              'object-src': ["'none'"],
              'script-src': ["'none'"],
              'script-src-attr': ["'none'"],
              'style-src': ["'self'", 'https:', "'unsafe-inline'"],
              'upgrade-insecure-requests': [],
            },
          }
        : false,

      frameguard: { action: 'deny' },
    }),
  );

  app.enableCors({
    origin: origins && origins.length > 0 ? origins : 'http://localhost:3000',
    credentials: true,
  });

  await app.listen(process.env.AUTH_PORT ?? 8001);
}

bootstrap().catch((err) => {
  console.error('Failed to start Auth Service:', err);
  process.exit(1);
});
