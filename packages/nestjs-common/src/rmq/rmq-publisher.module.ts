import { type DynamicModule, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';

interface RmqPublisherOptions {
  name: string;
  queue: string;
}

@Module({})
export class RmqPublisherModule {
  static register(publishers: RmqPublisherOptions[]): DynamicModule {
    return {
      module: RmqPublisherModule,
      imports: [
        ClientsModule.registerAsync(
          publishers.map(({ name, queue }) => ({
            name,
            useFactory: (configService: ConfigService) => ({
              transport: Transport.RMQ,
              options: {
                urls: [configService.getOrThrow<string>('RABBITMQ_URL')],
                queue,
                queueOptions: {
                  durable: true,
                  arguments: {
                    'x-dead-letter-exchange': '',
                    'x-dead-letter-routing-key': `${queue}.dlq`,
                  },
                },
                persistent: true,
              },
            }),
            inject: [ConfigService],
          })),
        ),
      ],
      exports: [ClientsModule],
    };
  }
}
