import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { RolesEnum } from './const/roles.const';

@Entity('users')
export class UsersModel {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    // 1)
    length: 20,
    // 2)
    unique: true,
  })
  // 1) 길이가 20을 넘지 않을 것
  // 2) 유니크한 값일 것
  nickname!: string;

  @Column({
    // 1)
    unique: true,
  })
  // 1) 유니크한 값일 것
  email!: string;

  @Column()
  password!: string;

  @Column({
    enum: Object.values(RolesEnum),
    default: RolesEnum.USER,
  })
  role!: RolesEnum;
}
