import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';

// TODO: same as auth service, move this to the shared NestJS package when done
const swaggerConfig = new DocumentBuilder()
  .setTitle('Product Service')
  .setDescription('Product Service API description')
  .setVersion('1.0')
  .addApiKey(
    {
      type: 'apiKey',
      in: 'header',
      name: 'x-bff-secret',
      description:
        'Shared secret between BFF and auth service. All requests (except /health) rejected without it.',
    },
    'bff-secret',
  )
  .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
  .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'refresh-token')
  .build();

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

  // Trust proxy - critical for rate limiting
  const trustProxy = process.env.TRUST_PROXY;
  if (trustProxy !== undefined) {
    if (trustProxy === 'true') {
      app.set('trust proxy', true);
    } else if (trustProxy === 'false') {
      app.set('trust proxy', false);
    } else if (/^\d+$/.test(trustProxy)) {
      app.set('trust proxy', parseInt(trustProxy, 10));
    } else {
      // IP pattern, subnet, or Express preset like 'loopback', 'linklocal'
      app.set('trust proxy', trustProxy);
    }
  }

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

      // In production, deny CORS for browser requests
      // (Note: Request still executes server-side but will hit BFF secret guard)
      if (isProduction) {
        callback(null, false);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: ['Content-Type', 'Authorization', 'x-bff-secret'],
  });

  // Swagger
  if (!isProduction) {
    const documentFactory = () => SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api', app, documentFactory);
  }

  // Graceful shutdown
  app.enableShutdownHooks();

  await app.listen(process.env.PRODUCT_PORT ?? 8002);
}

bootstrap().catch((err) => {
  console.error('Failed to start Product Service:', err);
  process.exit(1);
});
