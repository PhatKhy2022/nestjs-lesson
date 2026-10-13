import { ValidationPipe } from '@nestjs/common';
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';

// An e2e test boots the whole company (every module, guard, filter…) against the real database.
// Needs the database running: npm run db:up && npm run db:migrate && npm run db:seed
describe('Shop API (e2e)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    // Repeat what main.ts sets up, so the test app behaves like the real one.
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    // Fastify loads its plugins asynchronously: wait until it's ready before sending requests.
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/health is public', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/health')
      .expect(200);
    expect(res.body.data).toEqual({ status: 'ok', database: 'up' });
    expect(res.headers['x-request-id']).toBeDefined();
  });

  it('GET /api/products is public and wrapped in { data, timestamp }', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/products')
      .expect(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.timestamp).toBeDefined();
  });

  it('POST /api/orders without a token → 401', () => {
    return request(app.getHttpServer())
      .post('/api/orders')
      .send({ items: [{ productId: 1, quantity: 1 }] })
      .expect(401);
  });
});
