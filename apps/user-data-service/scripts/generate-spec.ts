import dotenv from 'dotenv';
import { expand } from 'dotenv-expand';
import path from 'path';

// dotenv must be initialized before module imports.
// Safe here because NestJS services compile to CJS where imports
// are not hoisted — ts-node executes them in source order.
expand(dotenv.config({ path: path.resolve(__dirname, '../../../.env') }));

import { generateSpec } from '@repo/nestjs-common';

import { AppModule } from '@/app.module';
import { swaggerConfig } from '@/common/helpers/swagger-config';

generateSpec(AppModule, swaggerConfig).catch((err) => {
  console.error('Unhandled error during User Data Service openapi spec generation:', err);
  process.exit(1);
});
