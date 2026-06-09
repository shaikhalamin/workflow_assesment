import { registerAs } from '@nestjs/config';
import { env } from './env';

export const appConfig = registerAs('app', () => ({
  nodeEnv: env.NODE_ENV,
  port: env.PORT,
  frontendOrigin: env.FRONTEND_ORIGIN,
  logLevel: env.LOG_LEVEL,
}));
