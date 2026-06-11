import { Controller, Get } from '@nestjs/common';
import { AppResponseDto } from './app-response.dto';
import { AppService } from './app.service';
import { Public } from './common/decorators/public.decorator';
import { ApiData } from './common/http/swagger';

@Public()
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiData(AppResponseDto, { errors: [429] })
  getHello(): AppResponseDto {
    return { message: this.appService.getHello() };
  }
}
