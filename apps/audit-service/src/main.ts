import './instrument';

import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';

import { getRmqConsumerOptions, RMQ_QUEUES } from '@repo/nestjs-common';

import amqplib from 'amqplib';

import { AppModule } from './app.module';

async function assertDlqQueue(url: string, queue: string) {
  const dlqQueue = `${queue}.dlq`;
  const connection = await amqplib.connect(url);
  const channel = await connection.createChannel();
  await channel.assertQueue(dlqQueue, { durable: true });
  await channel.close();
  await connection.close();
}

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

  const configService = app.get(ConfigService);
  const rabbitMQUrl = configService.getOrThrow<string>('RABBITMQ_URL');

  await assertDlqQueue(rabbitMQUrl, RMQ_QUEUES.AUDIT);

  app.connectMicroservice(getRmqConsumerOptions(rabbitMQUrl, RMQ_QUEUES.AUDIT));

  // Graceful shutdown
  app.enableShutdownHooks();

  await app.startAllMicroservices();
  await app.listen(process.env.AUDIT_PORT ?? 8004);
}

bootstrap().catch((err) => {
  console.error('Failed to start Audit Service:', err);
  process.exit(1);
});
