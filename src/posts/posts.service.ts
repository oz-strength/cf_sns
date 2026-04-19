import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostsModel } from './entities/posts.entity';

/**
 * author: string;
 * title: string;
 * content: string;
 * likeCount: number;
 * commentCount: number;
 */

export interface PostModel {
  id: number;
  author: string;
  title: string;
  content: string;
  likeCount: number;
  commentCount: number;
}

// let posts: PostModel[] = [
//   {
//     id: 1,
//     author: 'John Doe',
//     title: 'Hello World',
//     content: 'This is my first post!',
//     likeCount: 100,
//     commentCount: 20,
//   },
//   {
//     id: 2,
//     author: 'Jane Smith',
//     title: 'My Second Post',
//     content: 'This is another post.',
//     likeCount: 50,
//     commentCount: 10,
//   },
//   {
//     id: 3,
//     author: 'Bob Johnson',
//     title: 'My Third Post',
//     content: 'This is my third post.',
//     likeCount: 75,
//     commentCount: 15,
//   },
// ];

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(PostsModel)
    private readonly postsRepository: Repository<PostsModel>,
  ) {}

  async getAllPosts() {
    return this.postsRepository.find({
      relations: ['author'],
    });
  }

  async getPostById(id: number) {
    const post = await this.postsRepository.findOne({
      where: {
        id,
      },
      relations: ['author'],
    });

    if (!post) {
      throw new NotFoundException();
    }
    return post;
  }

  async createPost(authorId: number, title: string, content: string) {
    // 1) create -> 저장할 객체를 생성한다.
    // 2) save -> 실제로 데이터베이스에 저장한다.

    const post = this.postsRepository.create({
      author: { id: authorId },
      title,
      content,
      likeCount: 0,
      commentCount: 0,
    });

    const newPost = await this.postsRepository.save(post);
    return newPost;
  }

  async updatePost(postId: number, title?: string, content?: string) {
    // save의 기능
    // 1) id가 존재하는 경우 -> update
    // 2) id가 존재하지 않는 경우 -> create
    const post = await this.postsRepository.findOne({
      where: {
        id: postId,
      },
    });

    if (!post) {
      throw new NotFoundException();
    }

    if (title) {
      post.title = title;
    }
    if (content) {
      post.content = content;
    }

    const newPost = await this.postsRepository.save(post);
    return newPost;
  }

  async deletePost(postId: number) {
    const post = await this.postsRepository.findOne({
      where: {
        id: postId,
      },
    });

    if (!post) {
      throw new NotFoundException();
    }

    await this.postsRepository.delete(postId);
    return postId;
  }
}
