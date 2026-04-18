import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CashRegister } from '../../../database/entities/cash-register.entity';
import { CashRegisterController } from './cash-register.controller';
import { CashRegisterService } from './cash-register.service';
@Module({ imports: [TypeOrmModule.forFeature([CashRegister])], controllers: [CashRegisterController], providers: [CashRegisterService], exports: [CashRegisterService] })
export class CashRegisterModule {}
