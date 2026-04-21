import { Exclude } from 'class-transformer';
import { IsEmail, IsString, Length } from 'class-validator';
import { ChatsModel } from 'src/chats/entity/chats.entity';
import { MessagesModel } from 'src/chats/messages/entity/messages.entity';
import { BaseModel } from 'src/common/entity/base.entity';
import { emailValidationMessagse } from 'src/common/validation-message/email-validation.message';
import { lengthValidationMessage } from 'src/common/validation-message/length-validation.message';
import { stringValidationMessage } from 'src/common/validation-message/string-validation.message';
import { PostsModel } from 'src/posts/entities/posts.entity';
import { Column, Entity, JoinTable, ManyToMany, OneToMany } from 'typeorm';
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
  /**
   * Request
   * frontend -> backend
   * plain Object (JSON) -> class instance (dto)
   *
   * Response
   * backend -> frontend
   * class instance (dto) -> plain object (JSON)
   *
   * toClassOnly -> class instance로 변환될때만 (request)
   * toPlainOnly -> plain object로 변환될때만 (response)
   */
  @Exclude({
    toPlainOnly: true,
  })
  password!: string;

  @Column({
    enum: Object.values(RolesEnum),
    default: RolesEnum.USER,
  })
  role!: RolesEnum;

  @OneToMany(() => PostsModel, (post) => post.author)
  posts!: PostsModel[];

  @ManyToMany(() => ChatsModel, (chat) => chat.users)
  @JoinTable()
  chats: ChatsModel[];

  @OneToMany(() => MessagesModel, (message) => message.author)
  messages: MessagesModel;
}
