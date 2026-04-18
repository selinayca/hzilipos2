import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PriceChange } from '../../database/entities/price-change.entity';
import { PriceChangeLine } from '../../database/entities/price-change-line.entity';
import { Product } from '../../database/entities/product.entity';
import { PriceChangeController } from './price-change.controller';
import { PriceChangeService } from './price-change.service';

@Module({
  imports: [TypeOrmModule.forFeature([PriceChange, PriceChangeLine, Product])],
  controllers: [PriceChangeController],
  providers: [PriceChangeService],
  exports: [PriceChangeService],
})
export class PriceChangeModule {}
