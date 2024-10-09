import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessageServices } from './message.services';
import { MessageController } from './message.controller';

import { Messages } from '../../database/entities/messages.entity';
import { User } from '../../database/entities/user.entity';
import { Chat } from '../../database/entities/chat.entity';
import { ChatUsers } from 'src/database/entities/chatUsers.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Messages, User, Chat, ChatUsers])],
  providers: [MessageServices],
  controllers: [MessageController],
})
export class MessageModule {}