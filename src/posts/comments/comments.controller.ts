import { Controller } from '@nestjs/common';
import { CommentsService } from './comments.service';

@Controller('posts/:postId/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {
    /**
     * 1) entity 생성
     * author - 작성자
     * post - 귀속되는 포스트
     * comment - 댓글 내용
     * likeCount - 좋아요 수
     *
     * id - PrimaryGeneratedColumn
     * createdAt - 생성일자
     * updatedAt - 수정일자
     *
     * 2) GET() pagination
     * 3) GET(':commentId') 단일 댓글 조회
     * 4) POST() 댓글 생성
     * 5) PATCH(':commentId') 댓글 수정
     * 6) DELETE(':commentId') 댓글 삭제
     */
  }
}
