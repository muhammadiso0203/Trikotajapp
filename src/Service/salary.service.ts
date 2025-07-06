import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SalaryEntity } from 'src/entities/salary.entity';
import { UsersEntity } from 'src/entities/users.entity';
import { Repository } from 'typeorm';

@Injectable()
export class SalaryService {
  constructor(
    @InjectRepository(SalaryEntity)
    private readonly salaryRepo: Repository<SalaryEntity>,

    @InjectRepository(UsersEntity)
    private readonly userRepo: Repository<UsersEntity>,
  ) {}

  async createSalary(
    userId: number,
    amount: number,
    month: string,
    paidDate: string,
  ) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const salary = this.salaryRepo.create({
      user,
      amount,
      month,
      paid_date: paidDate,
    });
    await this.salaryRepo.save(salary);
  }

  async getUserSalaries(userId: number) {
    return this.salaryRepo.find({
      where: { user: { id: userId } },
      order: { paid_date: 'DESC' },
    });
  }

  async getSalaryByMonth(userId: number, month: Date) {
    return this.salaryRepo.findOne({
      where: { user: { id: userId }, month },
    });
  }

  async getAllSalary(){
    return this.salaryRepo.find({
        relations: ['user'],
        order: {paid_date: 'DESC'},
    });
  }
}
