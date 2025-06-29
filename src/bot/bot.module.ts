import { Module } from '@nestjs/common';
import { BotService } from './bot.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TelegrafModule } from 'nestjs-telegraf';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersEntity } from 'src/entities/users.entity';
import { UserService } from 'src/Service/user.service';
import { ProductService } from 'src/Service/product.service';
import { ProductEntity } from 'src/entities/product.entity';
import { RecordsEntity } from 'src/entities/records.entity';
import { SalaryEntity } from 'src/entities/salary.entity';
import { RecordService } from 'src/Service/record.service';
import { SalaryService } from 'src/Service/salary.service';

@Module({
  imports: [
    ConfigModule.forRoot({isGlobal: true}),
    TypeOrmModule.forFeature([UsersEntity, ProductEntity, RecordsEntity, SalaryEntity]),
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        token: config.get<string>('BOT_TOKEN') as string,
      }),
    }),
  ],
  providers: [BotService, UserService, ProductService, RecordService, SalaryService],
})
export class BotModule {}
