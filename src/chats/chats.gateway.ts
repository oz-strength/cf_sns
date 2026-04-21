import { UseFilters, UsePipes, ValidationPipe } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';
import { SocketCatchHttpExceptionFilter } from 'src/common/exception-filter/socket-catch-http.exception-filter';
import { UsersModel } from 'src/users/entities/users.entity';
import { UsersService } from 'src/users/users.service';
import { ChatsService } from './chats.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { EnterChatDto } from './dto/enter-chat.dto';
import { CreateMessagesDto } from './messages/dto/create-messages.dto';
import { ChatsMessagesService } from './messages/messages.service';

@WebSocketGateway({
  // ws://localhost:3000/chats
  namespace: 'chats',
})
export class ChatsGateway
  implements OnGatewayConnection, OnGatewayInit, OnGatewayDisconnect
{
  constructor(
    private readonly chatsService: ChatsService,
    private readonly messagesService: ChatsMessagesService,
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  @WebSocketServer()
  server: Server;

  afterInit(server: any) {
    console.log('WebSocket server initialized');
  }

  handleDisconnect(socket: Socket) {
    console.log(`on disconnect called: ${socket.id}`);
  }

  async handleConnection(socket: Socket & { user?: UsersModel }) {
    console.log(`on connect called : ${socket.id}`);

    const headers = socket.handshake.headers;

    // Bearer xxxx
    const rawToken = headers.authorization;

    if (!rawToken) {
      socket.disconnect();
      return;
    }

    try {
      const token = this.authService.extractTokenFromHeader(rawToken, true);

      const payload = this.authService.verifyToken(token);
      const user = await this.usersService.getUserByEmail(payload.email);

      if (!user) {
        throw new WsException('유저가 존재하지 않습니다');
      }

      socket.user = user;

      return true;
    } catch (e) {
      socket.disconnect();
    }
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
    @ConnectedSocket() socket: Socket & { user: UsersModel },
  ) {
    const chat = await this.chatsService.createChat(data);
  }

  @SubscribeMessage('enter_chat')
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
  async enterChat(
    // 방의 chat ID들을 리스트로 받는다.
    @MessageBody() data: EnterChatDto,
    @ConnectedSocket() socket: Socket & { user: UsersModel },
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
  async sendMessage(
    @MessageBody() dto: CreateMessagesDto,
    @ConnectedSocket() socket: Socket & { user: UsersModel },
  ) {
    const chatExists = await this.chatsService.checkIfChatExists(dto.chatId);

    if (!chatExists) {
      throw new WsException({
        code: 100,
        message: `Chat with ID ${dto.chatId} does not exist`,
      });
    }

    const message = await this.messagesService.createMessage(
      dto,
      socket.user.id,
    );

    socket
      .to(message!.chat.id.toString())
      .emit('receive_message', message!.message);
    // this.server
    //   .in(message.chatId.toString())
    //   .emit('receive_message', message.message);
  }
}
