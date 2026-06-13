import { registerAs } from '@nestjs/config';
import { env } from './env';

export const jwtConfig = registerAs('jwt', () => ({
  secret: env.JWT_SECRET,
}));
