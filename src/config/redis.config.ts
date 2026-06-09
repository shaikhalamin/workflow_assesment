import { registerAs } from '@nestjs/config';
import { env } from './env';

export const redisConfig = registerAs('redis', () => ({
  url: env.REDIS_URL,
}));
