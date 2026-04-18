import { Controller, Get, Param } from '@nestjs/common';
import { PostsService } from './posts.service';

/**
 * author: string;
 * title: string;
 * content: string;
 * likeCount: number;
 * commentCount: number;
 */

interface PostModel {
  id: number;
  author: string;
  title: string;
  content: string;
  likeCount: number;
  commentCount: number;
}

let posts: PostModel[] = [
  {
    id: 1,
    author: 'John Doe',
    title: 'Hello World',
    content: 'This is my first post!',
    likeCount: 100,
    commentCount: 20,
  },
  {
    id: 2,
    author: 'Jane Smith',
    title: 'My Second Post',
    content: 'This is another post.',
    likeCount: 50,
    commentCount: 10,
  },
  {
    id: 3,
    author: 'Bob Johnson',
    title: 'My Third Post',
    content: 'This is my third post.',
    likeCount: 75,
    commentCount: 15,
  },
];

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  // 1. GET /posts
  // 모든 post를 반환하는 API
  @Get()
  getPosts() {
    return posts;
  }

  // 2. GET /posts/:id
  // id에 해당하는 post를 반환하는 API
  @Get(':id')
  getPostById(@Param('id') id: string) {
    return posts.find((post) => post.id === +id);
  }

  // 3. POST /posts
  // 새로운 post를 생성하는 API

  // 4. PUT /posts/:id
  // id에 해당하는 post를 업데이트하는 API

  // 5. DELETE /posts/:id
  // id에 해당하는 post를 삭제하는 API
}
