import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { UsersEntity } from './users.entity';

@Entity('salaries')
export class SalaryEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => UsersEntity, (user) => user.salaries)
    @JoinColumn({name: 'user'})
    user: UsersEntity;

    @Column()
    amount: number;

    @Column()
    month: Date;

    @Column()
    paid_date: Date;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
