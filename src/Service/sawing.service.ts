import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductEntity } from 'src/entities/product.entity';
import { SewingEntity } from 'src/entities/sawing.entity';
import { UsersEntity } from 'src/entities/users.entity';

@Injectable()
export class SewingService {
  constructor(
    @InjectRepository(SewingEntity)
    private sewingRepo: Repository<SewingEntity>,
  ) {}

  async create(user: UsersEntity, product: ProductEntity, quantity: number) {
    const sewing = this.sewingRepo.create({
      user,
      product,
      quantity,
    });

    return this.sewingRepo.save(sewing);
  }

  async getUserSewings(telegramId: number) {
    return this.sewingRepo.find({
      where: {
        user: { telegramId },
      },
      relations: ['product', 'user'],
    });
  }

  async getUserStats(userId: number) {
    return this.sewingRepo
      .createQueryBuilder('sewing')
      .leftJoin('sewing.product', 'product')
      .select([
        'product.name AS productName',
        'product.unit_price AS unitPrice',
        'SUM(sewing.quantity) AS totalQuantity',
        'SUM(sewing.quantity * product.unit_price) AS totalSalary',
      ])
      .where('sewing.userId = :userId', { userId })
      .groupBy('product.name, product.unit_price')
      .getRawMany();
  }

  async getUserSalary(userId: number) {
    return this.sewingRepo
      .createQueryBuilder('sewing')
      .leftJoinAndSelect('sewing.product', 'product')
      .where('sewing.userId = :userId', { userId })
      .select('SUM(sewing.quantity * product.unit_price)', 'totalSalary')
      .getRawOne();
  }

  async removeSewedProduct(userId: number, sewingId: string) {
    const sewing = await this.sewingRepo.findOne({
      where: {
        id: sewingId,
        user: { telegramId: userId },
      },
      relations: ['user'],
    });

    if (!sewing) {
      throw new NotFoundException(
        '❌ Bu mahsulot sizga tegishli emas yoki mavjud emas.',
      );
    }

    await this.sewingRepo.remove(sewing);
  }
}
