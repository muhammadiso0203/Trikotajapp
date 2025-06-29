import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductEntity } from 'src/entities/product.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly ProductRepo: Repository<ProductEntity>,
  ) {}

  async getAllProduct(){
    const product = await this.ProductRepo.find({
        order: {created_at: 'DESC'}
    })
    return product;
  };

  async createProduct(data: {
    name: string;
    unit_price: number;
    description: string
  }){
    const product = this.ProductRepo.create(data)
    return this.ProductRepo.save(product)
  };

  async GetByIdProduct(id: string){
    const product = await this.ProductRepo.findOne({where: {id}})
    if(!product){
        throw new NotFoundException('Product Not Found')
    }
    return product
  }

  async removeProduct(id: string){
    const product = await this.ProductRepo.delete(id);
    if(product.affected === 0){
        throw new NotFoundException('Not Found Product')
    }
    return {succes: true};
  }
}
