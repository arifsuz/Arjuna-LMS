import { NestFactory } from '@nestjs/core';
import { ValidationPipe, RequestMethod } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { RedisIoAdapter } from './events/redis-io.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Trust proxy for Dokploy / Reverse Proxy IP resolution
  const expressApp = app.getHttpAdapter().getInstance();
  if (expressApp && typeof expressApp.set === 'function') {
    expressApp.set('trust proxy', 1);
  }

  const configService = app.get(ConfigService);

  // WebSocket Redis Adapter
  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);

  // Global prefix with root bypass
  app.setGlobalPrefix('api', {
    exclude: [
      { path: '', method: RequestMethod.GET },
      { path: '/', method: RequestMethod.GET },
      { path: 'health', method: RequestMethod.GET },
    ],
  });

  // Security headers & cookies
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.use(cookieParser());

  // CORS
  const corsOrigin = configService.get<string>(
    'CORS_ORIGIN',
    'http://localhost:3000',
  );
  const origins = corsOrigin.includes(',')
    ? corsOrigin.split(',').map((o) => o.trim()).filter(Boolean)
    : corsOrigin.trim();

  app.enableCors({
    origin: origins,
    credentials: true,
  });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // OpenAPI / Swagger Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('ARJUNA-LMS REST API & Real-Time Engine')
    .setDescription(
      'Dokumentasi API lengkap untuk Platform LMS Kampus Profesional & Pengumpulan Dataset Interaksi ARJUNA-Net.',
    )
    .setVersion('2.1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Masukkan Access Token JWT',
        in: 'header',
      },
      'JWT-auth',
    )
    .addCookieAuth('access_token', {
      type: 'apiKey',
      in: 'cookie',
      name: 'access_token',
      description: 'Session cookie httpOnly',
    })
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, swaggerDocument, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'ARJUNA LMS - API Documentation',
  });

  const port = configService.get<number>('PORT', 4000);
  await app.listen(port, '0.0.0.0');

  const isProduction = configService.get<string>('NODE_ENV') === 'production';
  const backendUrl = configService.get<string>(
    'BACKEND_URL',
    isProduction ? 'https://arjuna-api.sandiwarno.tech' : `http://localhost:${port}`,
  );

  console.log(`\n===========================================================`);
  console.log(`🚀 [ARJUNA LMS] Backend Engine v2.1.0 Started Successfully`);
  console.log(`🌍 Environment : ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
  console.log(`📡 Root URL    : ${backendUrl}`);
  console.log(`📡 API Base    : ${backendUrl}/api`);
  console.log(`📖 Swagger API : ${backendUrl}/api/docs`);
  console.log(`🟢 Health Check: ${backendUrl}/api/health`);
  console.log(`===========================================================\n`);
}
bootstrap();
