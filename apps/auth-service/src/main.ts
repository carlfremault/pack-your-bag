import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';

import { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';

import { AppModule } from './app.module';

async function bootstrap() {
  const isProduction = process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'test';

  // Logger setup
  const logLevels: ('log' | 'error' | 'warn' | 'debug' | 'verbose')[] = isProduction
    ? ['log', 'error', 'warn']
    : ['log', 'error', 'warn', 'debug'];

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: logLevels,
    bufferLogs: true,
  });

  // Trust proxy - critical for rate limiting
  app.set('trust proxy', process.env.TRUST_PROXY);

  // Security headers
  app.use(
    helmet({
      hsts: isProduction
        ? {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: false,
          }
        : false,

      contentSecurityPolicy: isProduction
        ? {
            directives: {
              'default-src': ["'none'"], // deny everything (no scripts, no images, etc.)
              'base-uri': ["'none'"], // probably overkill, but no cost to be safe
              'object-src': ["'none'"], // probably overkill, but no cost to be safe
              'frame-ancestors': ["'none'"], // protects against clickjacking in case a default html error page is served
            },
          }
        : false,
      crossOriginResourcePolicy: { policy: 'same-origin' },
      permittedCrossDomainPolicies: { permittedPolicies: 'none' }, // probably overkill, but no cost to be safe
      dnsPrefetchControl: { allow: false }, // probably overkill, but no cost to be safe
      noSniff: true,
      frameguard: { action: 'deny' },
      referrerPolicy: { policy: 'no-referrer' },
      xPoweredBy: false,
    }),
  );

  // Prevent any caching of API responses by default.
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    next();
  });

  // CORS
  app.enableCors({
    origin: (origin, callback) => {
      // BFF requests have no origin (server-to-server)
      if (!origin) return callback(null, true);

      // In production, block all browser requests
      if (isProduction) {
        callback(new Error('Not allowed by CORS'));
      } else {
        callback(null, true);
      }
    },
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: ['Content-Type', 'Authorization', 'x-bff-secret'],
  });

  // Graceful shutdown
  app.enableShutdownHooks();

  await app.listen(process.env.AUTH_PORT ?? 8001);
}

bootstrap().catch((err) => {
  console.error('Failed to start Auth Service:', err);
  process.exit(1);
});
