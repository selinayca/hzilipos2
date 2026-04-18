import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockMovement } from '../../database/entities/stock-movement.entity';
import { StockMovementLine } from '../../database/entities/stock-movement-line.entity';
import { Stock } from '../../database/entities/stock.entity';
import { Product } from '../../database/entities/product.entity';
import { Warehouse } from '../../database/entities/warehouse.entity';
import { StockMovementController } from './stock-movement.controller';
import { StockMovementService } from './stock-movement.service';

@Module({
  imports: [TypeOrmModule.forFeature([StockMovement, StockMovementLine, Stock, Product, Warehouse])],
  controllers: [StockMovementController],
  providers: [StockMovementService],
  exports: [StockMovementService],
})
export class StockMovementModule {}
