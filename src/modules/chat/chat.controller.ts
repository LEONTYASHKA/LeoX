import { ChatService } from './chat.service';
import { BadRequestException, Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { RegisterDto } from '../auth/dtos/register.dto';
import { CreateChatDto } from './dtos/create-chat.dto';
import { User } from '../auth/decorators/user.decorator';
import { UserInterface } from '../auth/interfaces/user.interface';
import { Chat } from '../../database/entities/chat.entity';
import { ChatsDto } from './dtos/chats.dto';
import { get } from 'http';
import { ChatInformationById } from './dtos/getChatById.dto';
import { MessageDto, MessagesInfo } from './dtos/messagesInfo.dto';
import { CreateMessageDto } from './dtos/createMessage.dto';
import { query } from 'express';






@Controller('chats')
export class ChatController {

  constructor(private readonly chatService: ChatService) {
  }

  @Post()
  async creatChat( @User() user: UserInterface, @Body() createChatDto: CreateChatDto){
    return this.chatService.createChat(user.sub, createChatDto.userIdToChat)
  }

  @Get(":id")
  async getChatById(@User() user: UserInterface, @Param('id', new ParseIntPipe()) chatId: number, ):Promise<ChatInformationById> {
   console.log(chatId)
    return this.chatService.getChatById(chatId)
  }

  @Get(":id/messages")
  async getMessageByChatId(@User() user: UserInterface, @Param('id', new ParseIntPipe()) chatId: number, @Query("pageNumber") pageNumber = 1 , @Query("countPerPage") countPerPage = 5):Promise<MessageDto[]> {
   
   console.log(countPerPage);
    return this.chatService.getMessageByChatId(chatId, user.sub, pageNumber, countPerPage)
  }
  

  @Get(":id/new-messages")
  async getNewMessages(@User() user: UserInterface, @Param('id', new ParseIntPipe()) chatId: number, @Query("lastMessageId") lastMessageId: number):Promise<MessageDto[]> {
    return this.chatService.getNewMessages(chatId, user.sub, lastMessageId)
  }


  @Get()
  async getChatInfo(@User() user: UserInterface):Promise<ChatsDto[]> {
    return this.chatService.getChatInfo(user.sub);
  }

@Post(":id/messages")
async createMessage(@User() user: UserInterface, @Param('id', new ParseIntPipe()) chatId: number, @Body () createMessageDto:CreateMessageDto){
  return this.chatService.createMessage(chatId, createMessageDto.text, user.sub )
}

@Post(':chatId/add-user')
async addUserToChat(@Param('chatId') chatId: number, @Body('userId') userId: number) {
  return this.chatService.addUserToChat(chatId, userId);
}
@Post(':chatId/set-last-read-message')
  async setLastReadMessage(
    @Param('chatId', ParseIntPipe) chatId: number,  
    @User() user: UserInterface,                  
    @Body('lastReadMessageId', ParseIntPipe) lastReadMessageId: number 
  ) {
   return  await this.chatService.setLastReadMessage(chatId, user.sub, lastReadMessageId);
  }

@Get(':chatId/unread-messages')
async getUnreadMessages(@Param('chatId', new ParseIntPipe()) chatId: number,
 @User() user: UserInterface): Promise<{ unreadMessages: number }> {
  const unreadMessages = await this.chatService.countUnreadMessages(chatId, user.sub);
  return { unreadMessages };
}
}