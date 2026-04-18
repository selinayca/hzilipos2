import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Warehouse } from '../../../database/entities/warehouse.entity';
import { WarehouseController } from './warehouse.controller';
import { WarehouseService } from './warehouse.service';
@Module({ imports: [TypeOrmModule.forFeature([Warehouse])], controllers: [WarehouseController], providers: [WarehouseService], exports: [WarehouseService] })
export class WarehouseModule {}
