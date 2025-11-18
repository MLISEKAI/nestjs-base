import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
  });

  const config = new DocumentBuilder()
    .setTitle('API Mock (v2)')
    .setDescription('API mock sử dụng mock data từ JSON files')
    .setVersion('2.0')
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
  SwaggerModule.setup('api/v2', app, document);

  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  const PORT = process.env.PORT || 3002;
  const HOST = '0.0.0.0';
  await app.listen(PORT, HOST);
  console.log(`🚀 Mock API Server is running on: http://${HOST}:${PORT}/api/v2`);
}
bootstrap();
