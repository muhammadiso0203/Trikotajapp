import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RecordsEntity } from './records.entity';
import { SalaryEntity } from './salary.entity';
import { SewingEntity } from './sawing.entity';
import { ProductEntity } from './product.entity';

export enum UserRole {
  ADMIN = 'admin',
  WORKER = 'worker',
}
@Entity('users')
export class UsersEntity {
  @PrimaryGeneratedColumn({type: 'bigint'})
  id: number;

  @Column()
  full_name: string;

  @Column({ nullable: true })
  username: string;

  @Column()
  phone_number: string;

  @Column({type: 'bigint'})
  telegramId: number;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.WORKER })
  role: string;

  @OneToMany(() => RecordsEntity, (record) => record.user)
  records: RecordsEntity[];

  @OneToMany(() => SalaryEntity, (salary) => salary.user)
  salaries: SalaryEntity[];

  @OneToMany(() => SewingEntity, (sewing) => sewing.user)
  sewing: SewingEntity[];

  @OneToMany(() => ProductEntity, (product) => product.user)
  product: ProductEntity[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
