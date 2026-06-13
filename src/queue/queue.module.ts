import { Global, Module } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { redisConfig } from '../config/redis.config';

const queuePrefix = (): string => {
  if (process.env.JEST_WORKER_ID) return `bull-test-${process.pid}`;
  return process.env.NODE_ENV === 'test' ? `bull-test-${process.pid}` : 'bull';
};

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [redisConfig.KEY],
      useFactory: (cfg: ConfigType<typeof redisConfig>) => ({
        connection: cfg.connection,
        prefix: queuePrefix(),
        defaultJobOptions: { removeOnComplete: 100, removeOnFail: 500 },
      }),
    }),
    BullModule.registerQueue({ name: 'audit-log' }),
  ],
  exports: [BullModule],
})
export class QueueModule {}
