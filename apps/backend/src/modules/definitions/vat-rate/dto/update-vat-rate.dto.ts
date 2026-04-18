import { PartialType } from '@nestjs/swagger';
import { CreateVatRateDto } from './create-vat-rate.dto';
export class UpdateVatRateDto extends PartialType(CreateVatRateDto) {}
