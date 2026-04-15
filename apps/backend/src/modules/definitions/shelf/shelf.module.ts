import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Shelf } from '../../../database/entities/shelf.entity';
import { ShelfController } from './shelf.controller';
import { ShelfService } from './shelf.service';
@Module({ imports: [TypeOrmModule.forFeature([Shelf])], controllers: [ShelfController], providers: [ShelfService], exports: [ShelfService] })
export class ShelfModule {}
