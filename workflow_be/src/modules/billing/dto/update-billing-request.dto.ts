import { PartialType } from '@nestjs/swagger';
import { CreateBillingRequestDto } from './create-billing-request.dto';

export class UpdateBillingRequestDto extends PartialType(
  CreateBillingRequestDto,
) {}
