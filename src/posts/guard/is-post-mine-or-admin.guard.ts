import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PostsService } from '../posts.service';

@Injectable()
export class IsPostMineOrAdminGuard implements CanActivate {
  constructor(private readonly postService: PostsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    const { user } = req;

    if (!user) {
      throw new UnauthorizedException(`사용자 정보를 가져올 수 없습니다.`);
    }

    /**
     * ADMIN인 경우는 통과
     */
    if (user.role === 'ADMIN') {
      return true;
    }

    const postId = req.params.postId;

    if (!postId) {
      throw new BadRequestException(`포스트ID가 파라미터로 제공돼야합니다.`);
    }

    const isOk = await this.postService.isPostMine(user.id, Number(postId));
    if (!isOk) {
      throw new ForbiddenException(`해당 포스트에 대한 권한이 없습니다.`);
    }

    return true;
  }
}
