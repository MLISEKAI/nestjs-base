// src/main.ts – FINAL VERSION (copy-paste là chiến vĩnh viễn)
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { ResponseExceptionFilter } from './common/filters/response-exception.filter';
import { SanitizeInputPipe } from './common/pipes/sanitize-input.pipe';
import { WINSTON_MODULE_NEST_PROVIDER } from './common/tracing/winston.config';

/**
 * bootstrap - Function để khởi động NestJS application
 *
 * Quy trình:
 * 1. Tạo NestJS application từ AppModule
 * 2. Setup security (helmet, CORS)
 * 3. Setup Swagger documentation
 * 4. Setup global pipes (validation, sanitization)
 * 5. Setup global interceptors (response formatting)
 * 6. Setup global filters (exception handling)
 * 7. Start server trên port 3001
 *
 * Lưu ý:
 * - Port: 3001
 * - Host: 0.0.0.0 (listen trên tất cả interfaces)
 * - Swagger UI: /api
 * - CORS: Cho phép tất cả origins (*)
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security
  app.use(helmet());
  app.enableCors({ origin: '*' }); // hoặc config chi tiết hơn

  // Global prefix (nên có)
  app.setGlobalPrefix(process.env.PREFIX_BASE?.trim() || 'api');

  // Logger Winston (nếu có)
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  // Global pipes
  app.useGlobalPipes(
    new SanitizeInputPipe(), // chống XSS
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      forbidUnknownValues: true,
    }),
  );

  // Global interceptor & filter
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new ResponseExceptionFilter());

  // Swagger chỉ ở dev/test
  if (!['production', 'prod'].includes(process.env.NODE_ENV || '')) {
    const config = new DocumentBuilder()
      .setTitle('My App API')
      .setDescription('API Documentation')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          in: 'header',
        },
        'JWT-auth',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('swagger', app, document);
  }

  const port = Number(process.env.PORT) || 3001;
  await app.listen(port, '0.0.0.0');

  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log(`Swagger: ${await app.getUrl()}/swagger`);
}

bootstrap();
