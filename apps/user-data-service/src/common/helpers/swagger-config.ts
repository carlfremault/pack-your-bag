import { DocumentBuilder } from '@nestjs/swagger';

export const swaggerConfig = new DocumentBuilder()
  .setTitle('User Data Service')
  .setDescription('User Data Service API description')
  .setVersion('1.0')
  .addApiKey(
    {
      type: 'apiKey',
      in: 'header',
      name: 'x-bff-secret',
      description:
        'Shared secret between BFF and user data service. All requests (except /health) rejected without it.',
    },
    'bff-secret',
  )
  .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
  .build();
