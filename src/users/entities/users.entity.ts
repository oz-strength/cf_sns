import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class UsersModel {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  nickname!: string;

  @Column()
  email!: string;

  @Column()
  password!: string;
}
