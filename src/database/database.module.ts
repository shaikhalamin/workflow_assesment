import { Global, Module } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { appConfig } from '../config/app.config';
import { databaseConfig } from '../config/database.config';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [databaseConfig.KEY, appConfig.KEY],
      useFactory: (
        db: ConfigType<typeof databaseConfig>,
        app: ConfigType<typeof appConfig>,
      ) => ({
        type: 'postgres',
        url: db.url,
        entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
        migrationsTableName: 'typeorm_migrations',
        synchronize: app.nodeEnv === 'development',
        migrationsRun: false,
        logging: app.nodeEnv === 'development' ? ['error', 'warn'] : ['error'],
        autoLoadEntities: true,
      }),
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
