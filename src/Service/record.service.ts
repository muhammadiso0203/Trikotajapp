import { NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductEntity } from 'src/entities/product.entity';
import { RecordsEntity } from 'src/entities/records.entity';
import { UsersEntity } from 'src/entities/users.entity';
import { Repository } from 'typeorm';

export class RecordService {
  constructor(
    @InjectRepository(RecordsEntity)
    private readonly recordRepo: Repository<RecordsEntity>,

    @InjectRepository(UsersEntity)
    private readonly userRepo: Repository<UsersEntity>,

    @InjectRepository(ProductEntity)
    private readonly productRepo: Repository<ProductEntity>,
  ) {}

  async createRecord(userId: string, productId: string, quantity: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const product = await this.productRepo.findOne({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const total_price = Number(product.unit_price) * quantity;

    const record = this.recordRepo.create({
      user,
      product,
      quantity,
      total_price,
    });
    return this.recordRepo.save(record);
  }

  async getUserRecord(userId: string) {
    return await this.recordRepo.find({
      where: { id: userId },
      relations: ['product'],
      order: { created_at: 'DESC' },
    });
  }

  async getuserStatistic(userId: string) {
    const record = await this.recordRepo.find({
      where: { user: { id: userId } },
    });

    const totalQuantity = record.reduce((sum, r) => sum + r.quantity, 0);
    const totalPrice = record.reduce(
      (sum, r) => sum + Number(r.total_price),
      0,
    );

    return { totalQuantity, totalPrice };
  }

  async getRecordsByMonth(month: string) {
    const start = new Date(`${month} - 01`);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);

    const records = await this.recordRepo
      .createQueryBuilder('record')
      .leftJoinAndSelect('record.user', 'user')
      .leftJoinAndSelect('record.product', 'product')
      .where('record.created_at >= :start AND record.created_at < :end', {
        start,
        end,
      })
      .getMany();

    return records;
  }
}
