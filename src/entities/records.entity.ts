import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UsersEntity } from './users.entity';
import { ProductEntity } from './product.entity';

@Entity('records')
export class RecordsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => UsersEntity, (user) => user.records)
  @JoinColumn({ name: 'user' })
  user: UsersEntity;

  @ManyToOne(() => ProductEntity, (product) => product.records)
  @JoinColumn({ name: 'product' })
  product: ProductEntity;

  @Column()
  quantity: number;

  @Column('decimal', { precision: 10, scale: 2 })
  total_price: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
