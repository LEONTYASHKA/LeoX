import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { Messages } from '../../database/entities/messages.entity';
import { Chat } from '../../database/entities/chat.entity';
import { ChatUsers } from '../../database/entities/chatUsers.entity';
import { User } from '../../database/entities/user.entity';
import { ChatGateway } from './chat.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([Chat, ChatUsers, User, Messages], )],
  providers: [ChatService, ChatGateway],
  controllers: [ChatController],
})
export class ChatModule {}