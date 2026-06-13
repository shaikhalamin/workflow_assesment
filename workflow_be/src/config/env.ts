import 'dotenv/config';
import { z } from 'zod';

const urlWithScheme = (schemes: readonly string[]) =>
  z.string().refine(
    (v) => {
      try {
        return schemes.includes(new URL(v).protocol.replace(':', ''));
      } catch {
        return false;
      }
    },
    { message: `must be a URL with protocol: ${schemes.join(', ')}` },
  );

const schema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(8870),

  DATABASE_URL: urlWithScheme(['postgres', 'postgresql']),
  REDIS_URL: urlWithScheme(['redis', 'rediss']),

  JWT_SECRET: z.string().min(32),

  COOKIE_DOMAIN: z.string().min(1),
  FRONTEND_ORIGIN: z.url(),
  MAILER_TRANSPORT: z.enum(['console', 'resend']).default('console'),
  RESEND_API_KEY: z.string().min(1).optional(),
  MAILER_FROM: z
    .string()
    .min(1)
    .default('Fiber@Home Workflow <no-reply@fiberathome.local>'),
  MAILER_COMPANY_ADDRESS: z.string().min(1).default('Fiber@Home Ltd.'),
  MAILER_SUPPORT_EMAIL: z.email().default('support@fiberathome.net'),
  LOG_LEVEL: z
    .enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal'])
    .default('info'),
});

export type Env = z.infer<typeof schema>;

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
    .join('\n');
  throw new Error(`Invalid environment configuration:\n${issues}`);
}

export const env: Env = parsed.data;
