import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRole, UsersEntity } from 'src/entities/users.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UsersEntity)
    private readonly UserRepo: Repository<UsersEntity>,
  ) {}

  async createIfNotExists(
    phone: string,
    full_name: string,
    username: string,
    telegramId: number,
  ) {
    const existing = await this.UserRepo.findOne({
      where: { telegramId },
    });

    if (existing) return existing;

    const user = this.UserRepo.create({
      full_name,
      username,
      phone_number: phone,
      telegramId,
      role: 'worker',
    });

    return await this.UserRepo.save(user);
  }

  async create(data: {
    full_name: string;
    telegram_id: number;
    phone_number: string;
  }) {
    const newUser = this.UserRepo.create({
      full_name: data.full_name,
      telegramId: data.telegram_id,
      phone_number: data.phone_number,
      role: 'worker', 
    });

    return this.UserRepo.save(newUser);
  }

  async getByPhone(phone_number: string) {
    const user = await this.UserRepo.findOne({ where: { phone_number } });
    if (!user) {
      throw new NotFoundException('Not Found By Phone');
    }
    return user;
  }

  async getAllWorker() {
    return this.UserRepo.find({
      where: { role: UserRole.WORKER },
      order: { created_at: 'DESC' },
    });
  }

  async getByTelegramId(telegramId: number) {
    return this.UserRepo.findOne({ where: { telegramId: telegramId } });
  }

  async deleteWorker(id: string) {
    const worker = await this.UserRepo.delete(id);
    if (worker.affected === 0) {
      throw new NotFoundException('Not Found Worker');
    }
    return { succes: true };
  }
}
