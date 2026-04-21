import { UseFilters, UsePipes, ValidationPipe } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SocketCatchHttpExceptionFilter } from 'src/common/exception-filter/socket-catch-http.exception-filter';
import { ChatsService } from './chats.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { EnterChatDto } from './dto/enter-chat.dto';
import { CreateMessagesDto } from './messages/dto/create-messages.dto';
import { ChatsMessagesService } from './messages/messages.service';

@WebSocketGateway({
  // ws://localhost:3000/chats
  namespace: 'chats',
})
export class ChatsGateway implements OnGatewayConnection {
  constructor(
    private readonly chatsService: ChatsService,
    private readonly messagesService: ChatsMessagesService,
  ) {}

  @WebSocketServer()
  server: Server;

  handleConnection(socket: Socket) {
    console.log(`on connection called : ${socket.id}`);
  }

  @UsePipes(
    new ValidationPipe({
      transform: true, // 값을 넣지 않아도 default 값이 형성되게 설정
      transformOptions: {
        enableImplicitConversion: true, // transformer의 @Type 없어도 자동으로 변환
      },
      whitelist: true, // DTO에 정의된 속성만 허용
      forbidNonWhitelisted: true, // 허용되지 않은 속성이 있으면 에러를 발생시킨다.
    }),
  )
  @UseFilters(SocketCatchHttpExceptionFilter)
  @SubscribeMessage('create_chat')
  async createChat(
    @MessageBody() data: CreateChatDto,
    @ConnectedSocket() socket: Socket,
  ) {
    const chat = await this.chatsService.createChat(data);
  }

  @SubscribeMessage('enter_chat')
  async enterChat(
    // 방의 chat ID들을 리스트로 받는다.
    @MessageBody() data: EnterChatDto,
    @ConnectedSocket() socket: Socket,
  ) {
    for (const chatId of data.chatIds) {
      const exists = await this.chatsService.checkIfChatExists(chatId);

      if (!exists) {
        throw new WsException({
          code: 100,
          message: `Chat with ID ${chatId} does not exist`,
        });
      }
    }

    socket.join(data.chatIds.map((chatId) => chatId.toString()));
  }

  // socket.on('send_message', (message) => {console.log(message)});
  @SubscribeMessage('send_message')
  async sendMessage(
    @MessageBody() dto: CreateMessagesDto,
    @ConnectedSocket() socket: Socket,
  ) {
    const chatExists = await this.chatsService.checkIfChatExists(dto.chatId);

    if (!chatExists) {
      throw new WsException({
        code: 100,
        message: `Chat with ID ${dto.chatId} does not exist`,
      });
    }

    const message = await this.messagesService.createMessage(dto);

    socket
      .to(message!.chat.id.toString())
      .emit('receive_message', message!.message);
    // this.server
    //   .in(message.chatId.toString())
    //   .emit('receive_message', message.message);
  }
}
