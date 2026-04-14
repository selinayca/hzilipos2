import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, MoreThan } from 'typeorm';
import { Product } from '../../database/entities/product.entity';
import { Stock } from '../../database/entities/stock.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Stock)
    private readonly stockRepo: Repository<Stock>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(tenantId: string, query: ProductQueryDto) {
    const qb = this.productRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.category', 'category')
      .leftJoinAndSelect('p.stock', 'stock')
      .where('p.tenantId = :tenantId', { tenantId })
      .andWhere('p.deletedAt IS NULL');

    if (query.activeOnly) {
      qb.andWhere('p.isActive = true');
    }
    if (query.categoryId) {
      qb.andWhere('p.categoryId = :categoryId', { categoryId: query.categoryId });
    }
    if (query.search) {
      qb.andWhere(
        '(p.name ILIKE :search OR p.barcode = :barcode)',
        { search: `%${query.search}%`, barcode: query.search },
      );
    }
    if (query.sinceVersion !== undefined) {
      qb.andWhere('p.version > :sinceVersion', { sinceVersion: query.sinceVersion });
    }

    qb.orderBy('p.sortOrder', 'ASC').addOrderBy('p.name', 'ASC');
    qb.skip((query.page - 1) * query.limit).take(query.limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      items,
      total,
      page: query.page,
      limit: query.limit,
      pages: Math.ceil(total / query.limit),
    };
  }

  async findOne(tenantId: string, id: string): Promise<Product> {
    const product = await this.productRepo.findOne({
      where: { id, tenantId },
      relations: ['category', 'stock'],
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async create(tenantId: string, dto: CreateProductDto): Promise<Product> {
    // Barcode uniqueness within tenant
    if (dto.barcode) {
      const exists = await this.productRepo.existsBy({
        tenantId,
        barcode: dto.barcode,
      });
      if (exists) {
        throw new ConflictException(`Barcode "${dto.barcode}" already exists`);
      }
    }

    return this.dataSource.transaction(async (em) => {
      const product = em.create(Product, {
        tenantId,
        name: dto.name,
        description: dto.description,
        barcode: dto.barcode,
        sku: dto.sku,
        priceCents: dto.priceCents,
        taxRateBps: dto.taxRateBps ?? 0,
        categoryId: dto.categoryId ?? null,
        imageUrl: dto.imageUrl ?? null,
        isActive: dto.isActive ?? true,
        trackStock: dto.trackStock ?? false,
      });
      await em.save(product);

      const stock = em.create(Stock, {
        tenantId,
        productId: product.id,
        quantity: dto.initialStock ?? 0,
      });
      await em.save(stock);

      return product;
    });
  }

  async update(tenantId: string, id: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(tenantId, id);

    if (dto.barcode && dto.barcode !== product.barcode) {
      const taken = await this.productRepo.existsBy({
        tenantId,
        barcode: dto.barcode,
      });
      if (taken) throw new ConflictException(`Barcode "${dto.barcode}" already exists`);
    }

    Object.assign(product, dto);
    product.version += 1; // bump version for POS incremental sync

    return this.productRepo.save(product);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const product = await this.findOne(tenantId, id);
    await this.productRepo.softRemove(product);
  }

  async adjustStock(
    tenantId: string,
    productId: string,
    delta: number,
    reason: string,
  ): Promise<Stock> {
    const stock = await this.stockRepo.findOne({ where: { tenantId, productId } });
    if (!stock) throw new NotFoundException('Stock record not found');
    stock.quantity = Math.max(0, stock.quantity + delta);
    return this.stockRepo.save(stock);
  }
}
