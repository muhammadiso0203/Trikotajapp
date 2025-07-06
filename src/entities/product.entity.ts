import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RecordsEntity } from './records.entity';
import { SewingEntity } from './sawing.entity';
import { UsersEntity } from './users.entity';

@Entity('products')
export class ProductEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('decimal', { precision: 10, scale: 2 })
  unit_price: number;

  @Column({ type: 'text' })
  description: string;

  @OneToMany(() => RecordsEntity, (record) => record.product)
  records: RecordsEntity[];

  @OneToMany(() => SewingEntity, (sewing) => sewing.product)
  sewing: SewingEntity;

  @ManyToOne(() => UsersEntity, (user) => user.product)
  user: UsersEntity;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
  product: any;
}
