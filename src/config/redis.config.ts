import { registerAs } from '@nestjs/config';
import type { RedisOptions } from 'bullmq';
import { env } from './env';

export const redisConnectionOptions = (url: string): RedisOptions => {
  const redisUrl = new URL(url);
  const db = redisUrl.pathname.slice(1);

  return {
    host: redisUrl.hostname,
    port: redisUrl.port ? Number(redisUrl.port) : 6379,
    ...(db ? { db: Number(db) } : {}),
    ...(redisUrl.username
      ? { username: decodeURIComponent(redisUrl.username) }
      : {}),
    ...(redisUrl.password
      ? { password: decodeURIComponent(redisUrl.password) }
      : {}),
    ...(redisUrl.protocol === 'rediss:' ? { tls: {} } : {}),
  };
};

export const redisConfig = registerAs('redis', () => ({
  url: env.REDIS_URL,
  connection: redisConnectionOptions(env.REDIS_URL),
}));
