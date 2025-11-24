// Import NestFactory để tạo NestJS application
import { NestFactory } from '@nestjs/core';
// Import ValidationPipe để validate dữ liệu
import { ValidationPipe } from '@nestjs/common';
// Import AppModule (root module)
import { AppModule } from './app.module';
// Import SwaggerModule và DocumentBuilder để tạo API documentation
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
// Import ResponseInterceptor để format response
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
// Import ResponseExceptionFilter để handle exceptions
import { ResponseExceptionFilter } from './common/filters/response-exception.filter';
// Import helmet để bảo mật HTTP headers
import helmet from 'helmet';
// Import SanitizeInputPipe để sanitize input (XSS protection)
import { SanitizeInputPipe } from './common/pipes/sanitize-input.pipe';

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

  app.use(helmet());
  app.enableCors({
    origin: '*',
  });

  const config = new DocumentBuilder()
    .setTitle('API')
    .setDescription('API mock')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.useGlobalPipes(
    new SanitizeInputPipe(),
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidUnknownValues: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new ResponseExceptionFilter());

  const PORT = 3001;
  const HOST = '0.0.0.0';
  await app.listen(PORT, HOST);
}
bootstrap();
