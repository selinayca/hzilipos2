import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import * as compression from 'compression';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger:
      process.env.NODE_ENV === 'production'
        ? ['error', 'warn']
        : ['error', 'warn', 'log', 'debug'],
  });

  // ── Security ────────────────────────────────────────────────────────────
  app.use(helmet());
  app.use(cookieParser());
  app.use(compression());

  // ── CORS ────────────────────────────────────────────────────────────────
  // Allow any subdomain of the configured domain + localhost in dev
  const domain = process.env.APP_DOMAIN || 'example.com';
  app.enableCors({
    origin: (origin, callback) => {
      const allowed = [
        new RegExp(`^https?://([a-z0-9-]+\\.)?${domain.replace('.', '\\.')}$`),
        /^http:\/\/localhost(:\d+)?$/,
        /^http:\/\/127\.0\.0\.1(:\d+)?$/,
      ];
      if (!origin || allowed.some((r) => r.test(origin))) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked: ${origin}`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID'],
  });

  // ── API prefix & versioning ──────────────────────────────────────────────
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  // ── Global pipes ────────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // strip unknown fields
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ── Global interceptors ─────────────────────────────────────────────────
  app.useGlobalInterceptors(new ResponseInterceptor());

  // ── Swagger (disabled in production) ────────────────────────────────────
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('HizliPOS API')
      .setDescription(
        'Multi-tenant POS & Backoffice SaaS – REST API documentation',
      )
      .setVersion('1.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' })
      .addCookieAuth('refresh_token')
      .addGlobalParameters({
        in: 'header',
        name: 'X-Tenant-ID',
        description: 'Tenant UUID (injected automatically by middleware in prod)',
      })
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = parseInt(process.env.APP_PORT ?? '3001', 10);
  await app.listen(port, '0.0.0.0');
  console.log(`🚀  HizliPOS API listening on port ${port}`);
}

bootstrap();
