import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AccessTokenGuard } from 'src/auth/guard/bearer-token.guard';
import { IsPublic } from 'src/common/decorator/is-public-decorator';
import { QueryRunner } from 'src/common/decorator/query-runner.decorator';
import { ImageModelType } from 'src/common/entity/image.entity';
import { TransactionInterceptor } from 'src/common/interceptor/transaction.interceptor';
import { Roles } from 'src/users/decorator/roles.decorator';
import { User } from 'src/users/decorator/user.decorator';
import { RolesEnum } from 'src/users/entities/const/roles.const';
import { UsersModel } from 'src/users/entities/users.entity';
import type { QueryRunner as QR } from 'typeorm';
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
  @IsPublic() // 이 API는 인증이 필요없음
  // @UseInterceptors(LogInterceptor)
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
  @IsPublic() // 이 API는 인증이 필요없음
  getPost(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.getPostById(id);
  }

  // 3. POST /posts
  // 새로운 post를 생성하는 API
  //
  // DTO - Data Transfer Object
  @Post()
  @UseInterceptors(TransactionInterceptor)
  async postPosts(
    @User('id') userId: number,
    @Body() body: CreatePostDto,
    @QueryRunner() qr: QR,
  ) {
    // 로직 실행
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

    return this.postsService.getPostById(post.id, qr);
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
  @Roles(RolesEnum.ADMIN)
  deletePost(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.deletePost(id);
  }

  // RBAC - Role Based Access Control
}
