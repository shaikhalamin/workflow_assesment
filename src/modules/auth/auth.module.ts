import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshTokenSession } from './entities/refresh-token-session.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RefreshTokenSession])],
  exports: [TypeOrmModule],
})
export class AuthModule {}
