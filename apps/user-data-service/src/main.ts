import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.UDS_PORT ?? 3003);
}
bootstrap().catch((err) => {
  console.error('Failed to start User Data Service:', err);
  process.exit(1);
});
