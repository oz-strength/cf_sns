import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CommentsService } from '../comments.service';

@Injectable()
export class IscommentMineOrAdminGuard implements CanActivate {
  constructor(private readonly commentService: CommentsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    const { user } = req;

    if (!user) {
      throw new UnauthorizedException(`사용자 정보를 가져올 수 없습니다.`);
    }

    if (user.role === 'ADMIN') {
      return true;
    }

    const commentId = req.params.commentId;

    const isOk = await this.commentService.isCommentMine(
      user.id,
      Number(commentId),
    );

    if (!isOk) {
      throw new ForbiddenException(`해당 댓글에 대한 권한이 없습니다.`);
    }

    return true;
  }
}
