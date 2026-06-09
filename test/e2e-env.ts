process.env.NODE_ENV = 'development';
process.env.DATABASE_URL ??=
  'postgresql://postgres:postgres@localhost:5432/workflow_be';
process.env.REDIS_URL ??= 'redis://localhost:6379';
process.env.JWT_SECRET ??= 'a'.repeat(32);
process.env.COOKIE_DOMAIN ??= 'localhost';
process.env.FRONTEND_ORIGIN ??= 'http://localhost:3000';
