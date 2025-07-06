import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { UsersEntity } from './users.entity';
import { ProductEntity } from './product.entity';

@Entity('sewings')
export class SewingEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => UsersEntity, (user) => user.sewing, {
  onDelete:'CASCADE',
})
  user: UsersEntity;

  @ManyToOne(() => ProductEntity, (product) => product.sewing, {
  onDelete:'CASCADE',
  })
  product: ProductEntity;

  @Column()
  quantity: number;

  @CreateDateColumn()
  created_at: Date;
}
