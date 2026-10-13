import helmet from '@fastify/helmet';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module.js';

// The front door of the company. The building is Fastify instead of Express:
// Nest talks to the HTTP server through an adapter, so the departments don't notice.
async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule, // reads AppModule and everything it imports
    new FastifyAdapter(),
  );
  const config = app.get(ConfigService);

  // Safer HTTP headers. A Fastify plugin (not Express middleware), so it's registered,
  // and before any route, so it applies to all of them.
  await app.register(helmet);
  app.enableCors({
    origin: config.get<string>('CORS_ORIGIN')?.split(',') ?? false,
  });
  app.setGlobalPrefix('api'); // every route starts with /api

  // Checks every @Body(), @Query() and @Param() DTO against its class-validator decorators.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip properties that have no decorator
      forbidNonWhitelisted: true, // …or rather: reject the request if it sends unknown properties
      transform: true, // turn plain JSON into DTO class instances (and apply defaults)
    }),
  );

  app.enableShutdownHooks(); // lets PrismaService disconnect cleanly on Ctrl+C

  const port = config.get<number>('PORT') ?? 3001;
  // Fastify listens only on localhost by default; '0.0.0.0' also accepts Docker/LAN traffic.
  await app.listen(port, '0.0.0.0');
  Logger.log(
    `Shop API (Fastify) running on http://localhost:${port}/api`,
    'Bootstrap',
  );
}
await bootstrap();
