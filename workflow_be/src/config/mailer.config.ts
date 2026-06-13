import { registerAs } from '@nestjs/config';
import { env } from './env';

export const mailerConfig = registerAs('mailer', () => ({
  transport: env.MAILER_TRANSPORT,
  resendApiKey: env.RESEND_API_KEY,
  from: env.MAILER_FROM,
  brand: {
    appUrl: env.FRONTEND_ORIGIN,
    companyAddress: env.MAILER_COMPANY_ADDRESS,
    supportEmail: env.MAILER_SUPPORT_EMAIL,
  },
}));
