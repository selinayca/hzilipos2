import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { Order } from '../../database/entities/order.entity';
import { OrderItem } from '../../database/entities/order-item.entity';
import { Product } from '../../database/entities/product.entity';
import { Stock } from '../../database/entities/stock.entity';
import { Category } from '../../database/entities/category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem, Product, Stock, Category])],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
