import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateChatDto } from './dtos/create-chat.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../database/entities/user.entity';
import { ArrayContains, In, MoreThan, Repository } from 'typeorm';
import { Chat } from '../../database/entities/chat.entity';
import { ChatUsers } from '../../database/entities/chatUsers.entity';
import { Messages } from '../../database/entities/messages.entity';
import { ChatsDto} from './dtos/chats.dto';

import { ChatInformationById, } from './dtos/getChatById.dto';
import { MessageDto, MessagesInfo } from './dtos/messagesInfo.dto';
import { log } from 'console';
import { text } from 'stream/consumers';



@Injectable()
export class ChatService {
  constructor(@InjectRepository(Chat)
              private chatRepository: Repository<Chat>,
              @InjectRepository(ChatUsers)
              private chatUsersRepository: Repository<ChatUsers>,
              @InjectRepository(User)
              private userRepository: Repository<User>,
              @InjectRepository(Messages)
              private messageRepository: Repository<Messages>
  ) {
  }

  async createChat(id: number, userIdToChat: number) {
    if (id === userIdToChat){
      throw new BadRequestException("You cannot create chat with yourself")
    }
    const existChat = await this.chatUsersRepository.find({
     select: {
      chat: {id: true},
      user:{id:true}
     },
      where: {
        user: {
          id:  In([userIdToChat, id])
        }
      },
      relations: ['chat' ,'user']
    })
    const firstUserChats = existChat.filter(el => el.user.id == id);
    const secondUserChats = existChat.filter(el => el.user.id == userIdToChat);

    const firstUseChatMap= firstUserChats.map((el) => {
      return el.chat.id;
    });
    const secondUserChatsMap = secondUserChats.map((el) => {
      return el.chat.id;
    });
    const sameChats = firstUseChatMap.filter(element => secondUserChatsMap.includes(element));
   console.log(sameChats)
    if (sameChats.length > 0) {

      const res = await this.chatUsersRepository.createQueryBuilder()
      .select(['chatId', 'count(*) as countPersons'])
      .where('chatId IN (:chatIds)', { chatIds: sameChats })
      .groupBy('chatId')
      .having('countPersons = :countPersons', { countPersons: 2})
      .getRawMany();
    if (res.length > 0){
      throw new BadRequestException("you have aready chat with this user")
    }
    }
      const newChat = await this.chatRepository.create({ name: "" });
      const createdChat = await this.chatRepository.save(newChat);
  
      const initator = await this.userRepository.findOneBy({ id })
      const initiatorChatUser = await this.chatUsersRepository.create({
        chat: createdChat,
        user: initator
      })
     
      await this.chatUsersRepository.save(initiatorChatUser)
      const userChatContact = await this.userRepository.findOneBy({ id: userIdToChat })
  
      const userChatContactToChat = await this.chatUsersRepository.create({
        chat: createdChat,
        user: userChatContact
      })
      await this.chatUsersRepository.save(userChatContactToChat)
 if (createdChat){
        throw new BadRequestException("Your chat was saccesfuly created")
      }
  }

  async getChatInfo(userId: number): Promise<ChatsDto[]> {
    const chatIds = await this.chatUsersRepository.find({
      select: {
        chat: {id: true}
      },
      where:{
        user: {
          id: userId
        }
      },
      relations: {
        chat: true,
      }
    })
    console.log(chatIds);
    const chatIdNumbers = chatIds.map((el) => {
      
      return el.chat.id;
    });
    console.log(chatIdNumbers);
 
    const chatsInfo = await  this.chatRepository.find({
      where: {
        id: In(chatIdNumbers),
      },
      select: {
        chatUsers: {
          id: true,
          user: {
            firstName: true,
            lastName: true,
            id: true,
          }
        }
      },
      relations: ["chatUsers", "chatUsers.user"]
      
    })
  
      const usersInChat = await Promise.all(chatsInfo.map(async(el) => {
        return {
          id: el.id,
          name: el.name,
          unreadMessageCount: await this.countUnreadMessages(el.id, userId),
          userInChat: el.chatUsers.map((element) => {
            return {
              id: element.id,
              firstName: element.user.firstName,
              lastName: element.user.lastName,
              userId: element.user.id,
              }
            }),
        }
      }));
    return usersInChat;
  };



  async getChatById (chatId: number): Promise<ChatInformationById> {
    const getChat = await this.chatRepository.findOne({
      where: {
        id: chatId,
      },
      select:{
      chatUsers: {
        id: true,
        user: {
          firstName: true,
          lastName: true,
          id: true,
        }
      }},
      relations: ["chatUsers", "chatUsers.user"]
    });
  
    if (!getChat) {
      throw new Error("chat not found ");
    }
  

  return {
      id: getChat.id,
      name: getChat.name,
     
      users: getChat.chatUsers.map((users) => {
       return {
         id: users.id,
         firstName: users.user.firstName,
         lastName: users.user.lastName,
         userId: users.user.id,
         }
       }),
};
}
async getMessageByChatId(chatId: number, userId: number, pageNumber: number, countPerPage: number): Promise<MessageDto[]> {
  const existUserInChat = await this.chatUsersRepository.findOne({
    where: {
      chat: {
        id: chatId,
      },
      user: {
        id: userId,
      },
    },
    select: {
      id: true
    },
  });
      
  if (!existUserInChat){
    throw new BadRequestException("This user  not chats")
  }
    const messagesInfo = await this.messageRepository.find({
      where: {
        chat: {
          id: chatId,
        },
      },
      select: {
        id: true,
        text: true,
        createdAt: true,
        user: {
          id: true,
          user: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      order: {
        createdAt: "DESC",
      },
      take: countPerPage ,
      skip: (pageNumber - 1) * countPerPage,
      relations: ["user", "user.user"],
    });

    if (!messagesInfo) {
      throw new Error("chat not found ");
    }
    return messagesInfo.map((msg) => ({
      id: msg.id,
      text: msg.text,
      createdAt: msg.createdAt,
      sender: {
        id: msg.user.user.id,
        firstName: msg.user.user.firstName,
        lastName: msg.user.user.lastName,
        isCurrentUserSent: msg.user.user.id == userId
      },
    })).reverse();
  }
  
  async createMessage(chatId: number, text: string, userId: number) {
      
    const chatFromDatabase = await this.chatRepository.findOne({where: {id: chatId}});
    const chatUserFromDatabaseByYourChatIdAndUserId = await this.chatUsersRepository.findOne({
      where: {
        chat: {
          id: chatId,
        },
        user: {
            id: userId
        }
      }
    })
    const newMessage = await this.messageRepository.create({chat: chatFromDatabase, user: chatUserFromDatabaseByYourChatIdAndUserId, text: text});
    await this.messageRepository.save(newMessage);
  }
    
  async getNewMessages(chatId: number, userId: number, lastMessageId?: number): Promise<MessageDto[]> {
    const existUserInChat = await this.chatUsersRepository.findOne({
      where: {
        chat: {
          id: chatId,
        },
        user: {
          id: userId,
        },
      },
      select: {
        id: true
      },
    });
        
    if (!existUserInChat){
      throw new BadRequestException("This user  not chats")
    }
  
    const messageCondition = {};
    if (lastMessageId) {
      messageCondition['id'] = MoreThan(lastMessageId);
    }
  console.log( messageCondition)
    // { id : MoreThan(lastMessageId) }
  
      const messagesInfo = await this.messageRepository.find({
        where: {
          chat: {
            id: chatId,
          },
          ...messageCondition
        },
        select: {
          id: true,
          text: true,
          createdAt: true,
          user: {
            id: true,
            user: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        order: {
          createdAt: "DESC",
        },
        relations: ["user", "user.user"],
      });
  
      if (!messagesInfo) {
        throw new Error("chat not found ");
      }
      return messagesInfo.map((msg) => ({
        id: msg.id,
        text: msg.text,
        createdAt: msg.createdAt,
        sender: {
          id: msg.user.user.id,
          firstName: msg.user.user.firstName,
          lastName: msg.user.user.lastName,
          isCurrentUserSent: msg.user.user.id == userId
        },
      })).reverse();
    }


    async addUserToChat(chatId: number, userId:number): Promise<any> {
      const chat = await this.chatRepository.findOne({where: {id: chatId}});
      if (!chat){
        console.log(chat)
        throw new BadRequestException("chat not found")
      }
      const user = await this.userRepository.findOne({ 
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        },
        where: {id: userId}
      });
      console.log(user)
      if(!user){
        console.log(user)
        throw new BadRequestException(" User not found")
      }
      const existingChatUser = await this.chatUsersRepository.findOne({
        where: {
          chat: {id: chatId},
        user: {id: userId} },
      });
      console.log(existingChatUser)
      if (existingChatUser){
        throw new BadRequestException("User is already a member of this chat");
      }
    
      const chatUser = this.chatUsersRepository.create({chat, user});
      await this.chatUsersRepository.save(chatUser);
      console.log(chatUser)
     // Проверка, является ли чат между двумя пользователями уникальным
  const existingUsersInChat = await this.chatUsersRepository.find({
    where: {
      chat: { id: chatId },
    },
    relations: ['user'],
  });

  // Если чат превращается в групповую беседу
  if (existingUsersInChat.length > 1) {
    // меняем  название чата или добавляем логику для группового чата
    chat.name = `Group Chat with ${existingUsersInChat.length} users`;
    await this.chatRepository.save(chat);
  }
console.log({...chat, user})
  return {...chat, newUser: {userId: user.id, ...user}}
}

async setLastReadMessage(chatId: number, userId: number, lastReadMessageId: number){
    const chat = await this.chatRepository.findOne({where: {id: chatId}});
    if (!chat){
      throw new BadRequestException("Chat not found")
    }
    const user = await this.userRepository.findOne({where: { id: userId}});
    if(!user) {
      throw new BadRequestException("User not found")
    }
    const readMessageId  = await this.messageRepository.findOne({where: {id: lastReadMessageId}});
    if (!readMessageId) { 
      throw new BadRequestException("Last message id not found")
    }
    
    await this.chatUsersRepository.update({ chat: chat, user: user }, {
      lastMessage: readMessageId
    })
  }

  async countUnreadMessages (chatId: number, userId: number): Promise<number>{
    const chatUser = await this.chatUsersRepository.findOne({
      where: { 
        chat: {id: chatId},
        user: {id: userId}},
        relations: ['lastMessage']
    });
    if (!chatUser){
      throw new BadRequestException("User not found in this chat");
    }
    const lastReadMessageId = chatUser.lastMessage?.id
    if (!lastReadMessageId) {
      return 0;
    }
   const unreadMessagesCount = await this.messageRepository.count({
    where: {
     chat: {id: chatId},
     id: MoreThan(lastReadMessageId)
    },

   });
   console.log(lastReadMessageId)
   return unreadMessagesCount;
  }
   
}