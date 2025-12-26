import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PRODUCT_PORT ?? 3001);
}
bootstrap().catch((err) => {
  console.error('Failed to start Product Service:', err);
  process.exit(1);
});
