import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentType } from '../../../database/entities/payment-type.entity';
import { CashRegister } from '../../../database/entities/cash-register.entity';
import { PaymentTypeController } from './payment-type.controller';
import { PaymentTypeService } from './payment-type.service';
@Module({ imports: [TypeOrmModule.forFeature([PaymentType, CashRegister])], controllers: [PaymentTypeController], providers: [PaymentTypeService], exports: [PaymentTypeService] })
export class PaymentTypeModule {}
