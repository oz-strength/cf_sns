import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { CommentsModel } from './entity/comments.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CommentsModel])],
  controllers: [CommentsController],
  providers: [CommentsService],
})
export class CommentsModule {}
