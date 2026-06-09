import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { TransformInterceptor } from '../src/common/http/response.interceptor';

jest.setTimeout(30_000);

interface ApiResponseBody<T> {
  data: T;
  error: null;
}

interface ExpenseCreatedBody {
  id: string;
}

interface AuthUserBody {
  user: {
    id: string;
    name: string;
    email: string;
    roles: string[];
    permissions: string[];
  };
}

describe('workflow demo flow (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
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
    const createdBody =
      created.body as unknown as ApiResponseBody<ExpenseCreatedBody>;

    await agent
      .post(`/api/expenses/${createdBody.data.id}/submit`)
      .send({})
      .expect(201);

    await agent.get('/api/workflow-tasks/my-pending').expect(200);
  });

  it('signs up a new employee and returns auth cookies', async () => {
    const unique = Date.now();
    const response = await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send({
        name: 'Signup Employee',
        email: `signup-${unique}@example.com`,
        password: 'Password123!',
      })
      .expect(201);
    const body = response.body as unknown as ApiResponseBody<AuthUserBody>;

    expect(body.error).toBeNull();
    expect(body.data.user.email).toBe(`signup-${unique}@example.com`);
    expect(body.data.user.roles).toContain('employee');
    expect(response.headers['set-cookie']).toEqual(
      expect.arrayContaining([
        expect.stringContaining('access_token='),
        expect.stringContaining('refresh_token='),
      ]),
    );
  });
});
