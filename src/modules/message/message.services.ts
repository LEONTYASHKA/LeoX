import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Messages } from '../../database/entities/messages.entity';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { RegisterDto } from '../auth/dtos/register.dto';
import { CreateMessageDto } from './dtos/create-message.dto';
import { Chat } from '../../database/entities/chat.entity';
import { ChatUsers } from 'src/database/entities/chatUsers.entity';

@Injectable()
export class MessageServices {
  constructor(
    @InjectRepository(Messages)
    private messagesRepository: Repository<Messages>, // Репозиторий для сообщений
    @InjectRepository(User)
    private userRepository: Repository<User>, // Репозиторий для пользователей
    @InjectRepository(Chat)
    private chatRepository: Repository<Chat>, // Репозиторий для пользователей
    @InjectRepository(ChatUsers)
    private chatUsersRepository: Repository<ChatUsers>,
  ) {}
  async createMessage(id: number, createMessage: CreateMessageDto) {
    const user = await this.userRepository.findOneBy({ id });
    if (!user){
      throw new BadRequestException("user with such id not found")
    }
    const chat = await this.chatRepository.findOneBy({id: 1});
  };

  async deleteMessage(chatId: number, messageId:number, userId: number){
    const chat = await this.chatRepository.findOne({ where: {id: chatId}});
    if (!chat) {
      throw new BadRequestException("Chat not found")
    }
    const chatUser = await this.chatUsersRepository.findOne({
      where: { chat: { id: chatId }, user: { id: userId } },
  });
    if (!chatUser){
     throw new BadRequestException("user in this chat not found");
  }
    const message = await this.messagesRepository.findOne({where: {id: messageId, chat: {id: chatId}}, relations: ['user']});
    if (!message){
      throw new BadRequestException("Message not found")
    }
    await this.messagesRepository.delete(messageId);
}
}
