import { INestApplication, Logger, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { TransformInterceptor } from '../src/common/http/response.interceptor';
import { SeedService } from '../src/modules/seed/seed.service';

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

const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

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

  it('signs up a new employee, returns auth cookies, and sends the welcome email from the queue processor', async () => {
    const unique = Date.now();
    const email = `signup-${unique}@example.com`;
    const logSpy = jest.spyOn(Logger.prototype, 'log');

    const response = await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send({
        name: 'Signup Employee',
        email,
        password: 'Password123!',
      })
      .expect(201);
    const body = response.body as unknown as ApiResponseBody<AuthUserBody>;

    expect(body.error).toBeNull();
    expect(body.data.user.email).toBe(email);
    expect(body.data.user.roles).toContain('employee');
    const employeePermissionSlugs =
      SeedService.rolePermissionSeeds.find(
        (seed) => seed.roleSlug === 'employee',
      )?.permissionSlugs ?? [];

    expect(employeePermissionSlugs).not.toHaveLength(0);
    expect(body.data.user.permissions).toEqual(
      expect.arrayContaining(employeePermissionSlugs),
    );
    expect(response.headers['set-cookie']).toEqual(
      expect.arrayContaining([
        expect.stringContaining('access_token='),
        expect.stringContaining('refresh_token='),
      ]),
    );

    for (let attempt = 0; attempt < 20; attempt += 1) {
      const loggedWelcomeEmail = logSpy.mock.calls.some(([message]) =>
        String(message).includes(`TO: ${email}`),
      );
      if (loggedWelcomeEmail) break;
      await wait(100);
    }

    expect(
      logSpy.mock.calls.some(([message]) =>
        String(message).includes(`TO: ${email}`),
      ),
    ).toBe(true);
    logSpy.mockRestore();
  });
});
