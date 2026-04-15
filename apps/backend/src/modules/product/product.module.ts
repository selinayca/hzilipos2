import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { Product } from '../../database/entities/product.entity';
import { Stock } from '../../database/entities/stock.entity';
import { Category } from '../../database/entities/category.entity';
import { Unit } from '../../database/entities/unit.entity';
import { StockGroup } from '../../database/entities/stock-group.entity';
import { Shelf } from '../../database/entities/shelf.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Stock, Category, Unit, StockGroup, Shelf])],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductModule {}
