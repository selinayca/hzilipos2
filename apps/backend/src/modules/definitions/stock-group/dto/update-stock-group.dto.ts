import { PartialType } from '@nestjs/swagger';
import { CreateStockGroupDto } from './create-stock-group.dto';
export class UpdateStockGroupDto extends PartialType(CreateStockGroupDto) {}
