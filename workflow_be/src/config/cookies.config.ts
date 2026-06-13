import { registerAs } from '@nestjs/config';
import { env } from './env';

export const cookiesConfig = registerAs('cookies', () => ({
  domain: env.COOKIE_DOMAIN,
}));
