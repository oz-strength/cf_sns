import { BaseModel } from 'src/common/entity/base.entity';
import { UsersModel } from 'src/users/entities/users.entity';
import { Column, Entity, ManyToOne } from 'typeorm';

@Entity()
export class PostsModel extends BaseModel {
  // 1) UsersModel과 연동한다. Foreign Key를 이용
  // 2) null이 될 수 없다. (게시글은 반드시 작성자가 있어야 한다.)
  @ManyToOne(() => UsersModel, (user) => user.posts, { nullable: false })
  author!: UsersModel;

  @Column()
  title!: string;

  @Column()
  content!: string;

  @Column()
  likeCount!: number;

  @Column()
  commentCount!: number;
}
