import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { Product } from '../../database/entities/product.entity';
import { Stock } from '../../database/entities/stock.entity';
import { Category } from '../../database/entities/category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Stock, Category])],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductModule {}
