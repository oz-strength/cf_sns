import { Exclude } from 'class-transformer';
import { IsEmail, IsString, Length } from 'class-validator';
import { BaseModel } from 'src/common/entity/base.entity';
import { emailValidationMessagse } from 'src/common/validation-message/email-validation.message';
import { lengthValidationMessage } from 'src/common/validation-message/length-validation.message';
import { stringValidationMessage } from 'src/common/validation-message/string-validation.message';
import { PostsModel } from 'src/posts/entities/posts.entity';
import { Column, Entity, OneToMany } from 'typeorm';
import { RolesEnum } from './const/roles.const';

@Entity()
export class UsersModel extends BaseModel {
  @Column({
    // 1)
    length: 20,
    // 2)
    unique: true,
  })
  @IsString({ message: stringValidationMessage })
  @Length(1, 20, { message: lengthValidationMessage })
  // 1) 길이가 20을 넘지 않을 것
  // 2) 유니크한 값일 것
  nickname!: string;

  @Column({
    // 1)
    unique: true,
  })
  @IsString({ message: stringValidationMessage })
  @IsEmail(
    {},
    {
      message: emailValidationMessagse,
    },
  )
  // 1) 유니크한 값일 것
  email!: string;

  @Column()
  @IsString({ message: stringValidationMessage })
  @Length(3, 8, { message: lengthValidationMessage })
  @Exclude()
  password!: string;

  @Column({
    enum: Object.values(RolesEnum),
    default: RolesEnum.USER,
  })
  role!: RolesEnum;

  @OneToMany(() => PostsModel, (post) => post.author)
  posts!: PostsModel[];
}
