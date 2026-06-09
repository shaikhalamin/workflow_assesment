import { Global, Module } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { redisConfig } from '../config/redis.config';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [redisConfig.KEY],
      useFactory: (cfg: ConfigType<typeof redisConfig>) => ({
        connection: { url: cfg.url },
        prefix:
          process.env.NODE_ENV === 'test' ? `bull-test-${process.pid}` : 'bull',
        defaultJobOptions: { removeOnComplete: 100, removeOnFail: 500 },
      }),
    }),
    BullModule.registerQueue({ name: 'audit-log' }),
  ],
  exports: [BullModule],
})
export class QueueModule {}
