import dotenv from 'dotenv';
import { expand } from 'dotenv-expand';
import path from 'path';

expand(dotenv.config({ path: path.resolve(__dirname, '../../../.env') }));

import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import * as fs from 'fs';

import { AppModule } from '../src/app.module';

async function generateSpec() {
  const app = await NestFactory.create(AppModule, { logger: false });

  const config = new DocumentBuilder()
    .setTitle('Auth Service')
    .setDescription('Auth Service API description')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'refresh-token')
    .build();

  let exitCode = 0;
  try {
    const document = SwaggerModule.createDocument(app, config);
    fs.writeFileSync('./openapi.json', JSON.stringify(document, null, 2));
    console.log('✅ OpenAPI spec generated at ./openapi.json');
  } catch (err) {
    console.error('❌ OpenAPI spec generation failed:', err);
    exitCode = 1;
  } finally {
    await app.close();
    process.exit(exitCode);
  }
}

generateSpec().catch((err) => {
  console.error('Unhandled error during generation:', err);
  process.exit(1);
});
