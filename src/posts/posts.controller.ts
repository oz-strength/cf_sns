import {
  Body,
  Controller,
  Delete,
  Get,
  InternalServerErrorException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AccessTokenGuard } from 'src/auth/guard/bearer-token.guard';
import { ImageModelType } from 'src/common/entity/image.entity';
import { LogInterceptor } from 'src/common/interceptor/log.interceptor';
import { User } from 'src/users/decorator/user.decorator';
import { UsersModel } from 'src/users/entities/users.entity';
import { DataSource } from 'typeorm';
import { CreatePostDto } from './dto/create-post.dto';
import { PaginatePostDto } from './dto/paginate-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostsImagesService } from './image/images.service';
import { PostsService } from './posts.service';

@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly dataSource: DataSource,
    private readonly postsImagesService: PostsImagesService,
  ) {}

  // 1. GET /posts
  // 모든 post를 반환하는 API
  @Get()
  @UseInterceptors(LogInterceptor)
  getPosts(@Query() query: PaginatePostDto) {
    return this.postsService.paginatePosts(query);
  }

  // POST /posts/random
  @Post('random')
  @UseGuards(AccessTokenGuard)
  async postPostsRandom(@User() user: UsersModel) {
    await this.postsService.generatePosts(user.id);

    return true;
  }

  // 2. GET /posts/:id
  // id에 해당하는 post를 반환하는 API
  @Get(':id')
  getPost(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.getPostById(id);
  }

  // 3. POST /posts
  // 새로운 post를 생성하는 API
  //
  // DTO - Data Transfer Object
  @Post()
  @UseGuards(AccessTokenGuard)
  async postPosts(
    @User('id') userId: number,
    @Body() body: CreatePostDto,
    // @Body('title') title: string,
    // @Body('content') content: string,
  ) {
    // 트랜잭션과 관련된 모든 쿼리를 담당할
    // 쿼리 러너를 생성한다.
    const qr = this.dataSource.createQueryRunner();

    // 쿼리 러너에 연결한다.
    await qr.connect();

    // 트랜잭션을 시작한다.
    // 이 시점부터  같은 쿼리 러너를 사용하면
    // 트랜잭션 안에서 데이터베이스 액션을 실행할 수 있다.
    await qr.startTransaction();

    // 로직 실행
    try {
      const post = await this.postsService.createPost(userId, body, qr);

      for (let i = 0; i < body.images.length; i++) {
        await this.postsImagesService.createPostImage(
          {
            post,
            order: i,
            path: body.images[i],
            type: ImageModelType.POST_IMAGE,
          },
          qr,
        );
      }

      // 트랜잭션을 커밋한다.
      // 트랜잭션 안에서 실행된 모든 데이터베이스 액션이 실제로 데이터베이스에 반영된다.
      await qr.commitTransaction();
      await qr.release();

      return this.postsService.getPostById(post.id);
    } catch (error) {
      // 어떤 에러가 던져지면
      // 트랜잭션을 종료하고 원래 상태로 되돌린댜.
      await qr.rollbackTransaction();
      await qr.release();

      throw new InternalServerErrorException('에러가 발생했습니다.');
    }
  }

  // 4. PATCH /posts/:id
  // id에 해당하는 post의 내용을 수정하는 API
  @Patch(':id')
  patchPost(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdatePostDto,
    // @Body('title') title?: string,
    // @Body('content') content?: string,
  ) {
    return this.postsService.updatePost(id, body);
  }

  // 5. DELETE /posts/:id
  // id에 해당하는 post를 삭제하는 API
  @Delete(':id')
  deletePost(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.deletePost(id);
  }
}
