import { Module } from '@nestjs/common';
import { BotModule } from './bot/bot.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductEntity } from './entities/product.entity';
import { RecordsEntity } from './entities/records.entity';
import { SalaryEntity } from './entities/salary.entity';
import { UsersEntity } from './entities/users.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.PG_HOST,
      port: Number(process.env.PG_PORT),
      username: process.env.PG_USER,
      password: String(process.env.PG_PASS),
      database: process.env.PG_DB,
      entities:[ProductEntity, RecordsEntity, SalaryEntity, UsersEntity],
      synchronize: true
    }),
    TypeOrmModule.forFeature([ProductEntity, RecordsEntity, SalaryEntity, UsersEntity]),
    BotModule
  ],
})
export class AppModule {}