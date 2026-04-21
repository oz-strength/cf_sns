import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CommonService } from 'src/common/common.service';
import { Repository } from 'typeorm';
import { CreateChatDto } from './dto/create-chat.dto';
import { PaginateChatDto } from './dto/paginate-chat.dto';
import { ChatsModel } from './entity/chats.entity';

@Injectable()
export class ChatsService {
  constructor(
    @InjectRepository(ChatsModel)
    private readonly chatsRepository: Repository<ChatsModel>,
    private readonly commonService: CommonService,
  ) {}

  paginateChats(dto: PaginateChatDto) {
    return this.commonService.paginate(
      dto,
      this.chatsRepository,
      {
        relations: {
          users: true,
        },
      },
      'chats',
    );
  }

  async createChat(dto: CreateChatDto) {
    const chat = await this.chatsRepository.save({
      // 1, 2, 3
      // [{ id: 1 }, { id: 2 }, { id: 3 }]
      users: dto.userIds.map((userId) => ({ id: userId })),
    });

    return this.chatsRepository.findOne({
      where: { id: chat.id },
    });
  }

  async checkIfChatExists(chatId: number) {
    const exists = await this.chatsRepository.exists({
      where: {
        id: chatId,
      },
    });

    return exists;
  }
}
