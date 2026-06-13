import { MODULE_METADATA } from '@nestjs/common/constants';
import { AppModule } from './app.module';
import { QueueModule } from './queue/queue.module';

describe('AppModule', () => {
  it('imports the queue root module so BullMQ workers receive Redis config', () => {
    const imports =
      (Reflect.getMetadata(MODULE_METADATA.IMPORTS, AppModule) as
        | unknown[]
        | undefined) ?? [];

    expect(imports).toContain(QueueModule);
  });
});
