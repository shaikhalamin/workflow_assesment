import 'dotenv/config';
import { DataSource } from 'typeorm';
import { join } from 'path';
import { env } from '../config/env';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: env.DATABASE_URL,
  entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
  migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
  migrationsTableName: 'typeorm_migrations',
  synchronize: false,
  migrationsRun: false,
  logging: env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});
