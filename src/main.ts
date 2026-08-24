import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Validación automática de DTOs en todas las rutas
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Elimina propiedades no declaradas en el DTO
      forbidNonWhitelisted: true, // Lanza error si llegan propiedades extra (seguridad)
      transform: true, // Transforma payloads planos a instancias de clase (respeta tipos del DTO)
      transformOptions: {
        enableImplicitConversion: true, // Permite convertir tipos primitivos automáticamente (ej. query params)
      },
    }),
  );

  // Habilita el consumo de la API desde el frontend en Next.js
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
}
bootstrap();
