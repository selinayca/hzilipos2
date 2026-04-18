import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockGroup } from '../../../database/entities/stock-group.entity';
import { StockGroupController } from './stock-group.controller';
import { StockGroupService } from './stock-group.service';
@Module({ imports: [TypeOrmModule.forFeature([StockGroup])], controllers: [StockGroupController], providers: [StockGroupService], exports: [StockGroupService] })
export class StockGroupModule {}
