import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModel } from './entities/users.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([UsersModel])], // Repository를 DI 컨테이너에 등록
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
