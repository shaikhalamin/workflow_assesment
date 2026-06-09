import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types';
import { TransformInterceptor } from '../src/common/http/response.interceptor';

jest.setTimeout(30_000);

describe('workflow demo flow (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    process.env.NODE_ENV = 'development';
    process.env.DATABASE_URL ??=
      'postgresql://postgres:postgres@localhost:5432/workflow_be';
    process.env.REDIS_URL ??= 'redis://localhost:6379';
    process.env.JWT_SECRET ??= 'a'.repeat(32);
    process.env.COOKIE_DOMAIN ??= 'localhost';
    process.env.FRONTEND_ORIGIN ??= 'http://localhost:3000';
    const { AppModule } = require('../src/app.module') as typeof import('../src/app.module');
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: false },
      }),
    );
    app.useGlobalInterceptors(new TransformInterceptor(app.get(Reflector)));
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('logs in, creates expense, submits it, and lists pending tasks', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/api/auth/login')
      .send({ email: 'employee@example.com', password: 'Password123!' })
      .expect(201);

    const created = await agent
      .post('/api/expenses')
      .send({
        title: 'Travel reimbursement',
        description: 'Client visit',
        amount: 7500,
        currency: 'BDT',
        category: 'travel',
        vendor: 'ACME',
        itemValue: 7500,
        price: 7500,
        quantity: 1,
      })
      .expect(201);

    await agent
      .post(`/api/expenses/${created.body.data.id}/submit`)
      .send({})
      .expect(201);

    await agent.get('/api/workflow-tasks/my-pending').expect(200);
  });
});
