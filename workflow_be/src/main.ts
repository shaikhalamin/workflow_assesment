import { NestFactory, Reflector } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger, RequestMethod, ValidationPipe } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import { AppModule } from './app.module';
import { appConfig } from './config/app.config';
import { ResponseExceptionFilter } from './common/http/response.filter';
import { TransformInterceptor } from './common/http/response.interceptor';
import { ENVELOPE_EXTRA_MODELS } from './common/http/swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    rawBody: true,
  });

  const cfg = app.get<ConfigType<typeof appConfig>>(appConfig.KEY);

  app.use(helmet());
  app.use(cookieParser());
  app.use(compression());

  app.setGlobalPrefix('api', {
    exclude: [{ path: '/', method: RequestMethod.GET }],
  });

  app.enableCors({
    origin: cfg.frontendOrigin,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  app.useGlobalInterceptors(new TransformInterceptor(app.get(Reflector)));
  app.useGlobalFilters(new ResponseExceptionFilter());

  app.enableShutdownHooks();

  if (cfg.nodeEnv !== 'production') {
    const docCfg = new DocumentBuilder()
      .setTitle('Worflow API')
      .setDescription('Worflow API endpoints')
      .setVersion('0.1.0')
      .addCookieAuth(
        'access_token',
        { type: 'apiKey', in: 'cookie', name: 'access_token' },
        'access_token',
      )
      .build();
    const doc = SwaggerModule.createDocument(app, docCfg, {
      extraModels: [...ENVELOPE_EXTRA_MODELS],
    });
    SwaggerModule.setup('docs', app, doc);
  }

  await app.listen(cfg.port, '0.0.0.0', () => {
    Logger.log(`Application started on http://0.0.0.0:${cfg.port}`);
  });
}
void bootstrap();
