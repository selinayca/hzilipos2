import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VatRate } from '../../../database/entities/vat-rate.entity';
import { VatRateController } from './vat-rate.controller';
import { VatRateService } from './vat-rate.service';

@Module({
  imports: [TypeOrmModule.forFeature([VatRate])],
  controllers: [VatRateController],
  providers: [VatRateService],
  exports: [VatRateService],
})
export class VatRateModule {}
