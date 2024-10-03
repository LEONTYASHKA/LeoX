import { Body, Controller, Post } from '@nestjs/common';
import { MessageServices } from './message.services';
import { CreateMessageDto } from './dtos/create-message.dto';
import { UserInterface } from '../auth/interfaces/user.interface';
import { User } from '../auth/decorators/user.decorator';

@Controller('messages')
export class MessageController {
  constructor(private readonly messageService: MessageServices) {

  }@Post('send')
  async createMessage (@User() user: UserInterface, @Body() createMessage: CreateMessageDto) {
    return this.messageService.createMessage(user.sub, createMessage);
  }
}
