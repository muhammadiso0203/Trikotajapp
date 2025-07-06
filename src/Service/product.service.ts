import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductEntity } from 'src/entities/product.entity';
import { SewingEntity } from 'src/entities/sawing.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly ProductRepo: Repository<ProductEntity>,
    @InjectRepository(SewingEntity)
    private readonly SawingRepo: Repository<SewingEntity>,
  ) {}

  async getAllProduct() {
    const product = await this.ProductRepo.find({
      order: { created_at: 'DESC' },
    });
    return product;
  }

  async createProduct(
    name: string,
    unit_price: number,
    description: string,
  ): Promise<ProductEntity> {
    const product = this.ProductRepo.create({ name, unit_price, description });
    return await this.ProductRepo.save(product);
  }

  async GetByIdProduct(id: string) {
    const product = await this.ProductRepo.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException('Product Not Found');
    }
    return product;
  }

  async updateProduct(id: string, data: { name: string; unit_price: number }) {
    return this.ProductRepo.update(id, data);
  }

  async removeProduct(id: string) {
    const product = await this.ProductRepo.delete(id);
    if (product.affected === 0) {
      throw new NotFoundException('Not Found Product');
    }
    return { succes: true };
  }

  async getUserProducts(telegramId: number) {
return this.SawingRepo.find({
  where: { user: { telegramId } },
  relations: [
    'product',
    'product.records',
    'product.records.user',
  ],
});

  }
}
