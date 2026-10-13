import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module.js';

// The front door of the company.
async function bootstrap() {
  const app = await NestFactory.create(AppModule); // reads AppModule and everything it imports
  const config = app.get(ConfigService);

  app.use(helmet()); // safer HTTP headers
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
  await app.listen(port);
  Logger.log(`Shop API running on http://localhost:${port}/api`, 'Bootstrap');
}
await bootstrap();
