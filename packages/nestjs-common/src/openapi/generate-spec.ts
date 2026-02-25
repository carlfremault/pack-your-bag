import { Logger, Type } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { OpenAPIObject, SwaggerModule } from '@nestjs/swagger';

import * as fs from 'fs';
import * as path from 'path';

export async function generateSpec(
  AppModule: Type<unknown>,
  swaggerConfig: Omit<OpenAPIObject, 'paths'>,
  outputPath = './openapi.json',
): Promise<void> {
  let app: Awaited<ReturnType<typeof NestFactory.create>> | undefined;
  let exitCode = 0;

  try {
    app = await NestFactory.create(AppModule, { logger: false });

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    fs.writeFileSync(path.resolve(outputPath), JSON.stringify(document, null, 2));

    Logger.log(`✅ OpenAPI spec written to ${outputPath}`, 'GenerateSpec');
  } catch (err) {
    const stack = err instanceof Error ? err.stack : String(err);
    Logger.error('❌ OpenAPI spec generation failed', stack, 'GenerateSpec');
    exitCode = 1;
  } finally {
    await app?.close();
    process.exit(exitCode);
  }
}
