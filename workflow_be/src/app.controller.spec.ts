import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { IS_PUBLIC_KEY } from './common/decorators/public.decorator';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return the configured greeting', () => {
      expect(appController.getHello()).toEqual({
        message: 'Hello World! Changed again !!!!',
      });
    });

    it('marks the base controller as public', () => {
      const isPublic: unknown = Reflect.getMetadata(
        IS_PUBLIC_KEY,
        AppController,
      );

      expect(isPublic).toBe(true);
    });
  });
});
