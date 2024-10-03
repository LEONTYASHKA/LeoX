import {
    ConnectedSocket,
    MessageBody,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
    WsResponse,
  } from '@nestjs/websockets';
  import { Server } from 'socket.io';
  import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from '../auth/constants';
import { ChatService } from './chat.service';
  
  @WebSocketGateway( 8001, {
    cors: {
      origin: '*',
    },
  })
  export class ChatGateway {

    @WebSocketServer()
    server: Server;
      
    constructor (private readonly jwtService: JwtService,
        private readonly chatService: ChatService 
    ) {}
 
    private activeSockets = new Map<number, string[]>(); // Маппинг userId => список сокетов
    
    async handleConnection(client: any, ...args: any[]) {
        const token = client.handshake.query.token;
        const user = await this.verifyToken(token);
      
        if (user) {
          client.userId = user.sub;
      
          // Добавляем сокет пользователя в активные соединения
          if (!this.activeSockets.has(user.sub)) {
            this.activeSockets.set(user.sub, []);
          }
          this.activeSockets.get(user.sub).push(client.id);
          
          // Присоединяем пользователя к комнате на основе chatId
          const chatId = client.handshake.query.chatId;
          if (chatId) {
            client.join(`chat_${chatId}`);
            console.log(`User ${user.sub} connected to chat_${chatId} with socket ${client.id}`);
          }
        } else {
          client.disconnect();
        }
      }

  handleDisconnect(client: any) {
    const userId = client.userId;

    if (userId && this.activeSockets.has(userId)) {
      const sockets = this.activeSockets.get(userId).filter(socketId => socketId !== client.id);

      if (sockets.length === 0) {
        this.activeSockets.delete(userId);
      } else {
        this.activeSockets.set(userId, sockets);
      }

      console.log(`User ${userId} disconnected socket ${client.id}`);
    }
  }

  // Пример отправки сообщения конкретному пользователю
  sendMessageToUser(userId: number, message: string) {
    const sockets = this.activeSockets.get(userId);

    if (sockets) {
      sockets.forEach(socketId => {
        this.server.to(socketId).emit('message', message);
      });
    }
  }

  async verifyToken(token: string): Promise<{ sub: number } | null> {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: jwtConstants.secret,
      });
      return payload;
    } catch (error) {
      console.error("Token verification failed:", error);
      return null;
    }
  }

  @SubscribeMessage('chat.message')
    async sendMessage(
  @MessageBody() payload: { chatId: number, message: string },
  @ConnectedSocket() client: any
) {
  console.log(`Message for chat ${payload.chatId}:`, payload.message);
  console.log(`User ${client.userId} sent a message`);

  // Сохраняем сообщение в базе данных через ChatService
  await this.chatService.createMessage(payload.chatId, payload.message, client.userId);

// Получаем обновленные сообщения из базы данных
const messages = await this.chatService.getMessageByChatId(
    payload.chatId,
    client.userId,
    1, // pageNumber
    5 // countPerPage
  );

  // Отправляем обновленный список сообщений всем пользователям в комнате
  this.server.to(`chat_${payload.chatId}`).emit('message', {
    chatId: payload.chatId,
    messages: messages,
  });

  console.log("are you here?");
}
}
  
