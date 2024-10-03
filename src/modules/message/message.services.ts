import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Messages } from '../../database/entities/messages.entity';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { RegisterDto } from '../auth/dtos/register.dto';
import { CreateMessageDto } from './dtos/create-message.dto';
import { Chat } from '../../database/entities/chat.entity';

@Injectable()
export class MessageServices {
  constructor(
    @InjectRepository(Messages)
    private messagesRepository: Repository<Messages>, // Репозиторий для сообщений
    @InjectRepository(User)
    private userRepository: Repository<User>, // Репозиторий для пользователей
    @InjectRepository(Chat)
    private chatRepository: Repository<Chat>, // Репозиторий для пользователей
  ) {}
  async createMessage(id: number, createMessage: CreateMessageDto) {
    const user = await this.userRepository.findOneBy({ id });
    if (!user){
      throw new BadRequestException("user with such id not found")
    }

    
    const chat = await this.chatRepository.findOneBy({id: 1});

  }
}
