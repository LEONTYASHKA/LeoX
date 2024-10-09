import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateChatDto } from './dtos/create-chat.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../database/entities/user.entity';
import { ArrayContains, Db, In, MoreThan, Repository } from 'typeorm';
import { Chat } from '../../database/entities/chat.entity';
import { ChatUsers } from '../../database/entities/chatUsers.entity';
import { Messages } from '../../database/entities/messages.entity';
import { ChatsDto} from './dtos/chats.dto';

import { ChatInformationById, } from './dtos/getChatById.dto';
import { MessageDto, MessagesInfo } from './dtos/messagesInfo.dto';
import { log } from 'console';
import { text } from 'stream/consumers';
import { NewMethodGetChatInfo } from './dtos/newMethodGetChatIndo';
import { ChatType } from 'src/common/enums/chat-type.enum';



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
    const initator = await this.userRepository.findOneBy({ id })
    const userChatContact = await this.userRepository.findOneBy({ id: userIdToChat })
    const chatName = `${userChatContact.firstName} ${userChatContact.lastName} , ${initator.firstName} ${initator.lastName}`;
      const newChat = await this.chatRepository.create({ name: chatName });
      const createdChat = await this.chatRepository.save(newChat);
  
      
      const initiatorChatUser = await this.chatUsersRepository.create({
        chat: createdChat,
        user: initator
      })
     
      await this.chatUsersRepository.save(initiatorChatUser);
      const userChatContactToChat = await this.chatUsersRepository.create({
        chat: createdChat,
        user: userChatContact
      })
      await this.chatUsersRepository.save(userChatContactToChat)
 if (createdChat){
        throw new BadRequestException("Your chat was saccesfuly created")
      }
  }

  async getChatInfo(userId: number, options: any): Promise<NewMethodGetChatInfo[]> {
  const chatIds = await this.chatUsersRepository.find({
    select: {
      chat: { id: true },
    },
    where: {
      user: { id: userId },
      isLeft: false
    },
    relations: { chat: true },
  });

  const chatIdNumbers = chatIds.map((el) => el.chat.id);

  // Получаем информацию о чатах
  const chatsInfo: {id: number, name: string} []= await this.chatUsersRepository
  .createQueryBuilder('chatUser')
  .select(['chatUser.chatId', 'chatId'])
  .addSelect('COUNT(chatUser.userId)', 'count')
  .addSelect('chat.name','name')
  .innerJoin('chatUser.chat', 'chat')
  .groupBy('chatUser.chatId')
  .having('count = :count', {count: 2 })
    .andWhere(db =>{
      const subQuery = db
      .subQuery()
      .select('chatUser.chatId')
      .from(ChatUsers, 'chatUser')
      .where('chatUser.userId = :userId', {userId})
      .getQuery();
        return 'chatUser.chatId IN' + subQuery
    })
    .getRawMany();

  await this.chatRepository.find({
    where: { id: In(chatIdNumbers) },
  });

  // Для каждого чата получаем последнее сообщение и количество непрочитанных сообщений
  const chatData = await Promise.all(chatsInfo.map(async (chat) => {
    // Получаем последнее сообщение в чате, включая информацию о пользователе (sender)
    const lastMessage = await this.messageRepository.findOne({
      where: { chat: { id: chat.id } },
      order: { createdAt: "DESC" }, // Самое последнее сообщение
      relations: ['user', 'user.user'],  // Убедись, что загружаешь связь с user
    });

    // Если последнее сообщение не найдено или поле user не существует
    const lastMessageData = lastMessage ? {

      text: lastMessage.text,
      createdAt: lastMessage.createdAt,
      sender: lastMessage.user && lastMessage.user.user ? {
        id: lastMessage.user.user.id,
        firstName: lastMessage.user.user.firstName,
        lastName: lastMessage.user.user.lastName,
      } : null
    } : null;

    // Получаем количество непрочитанных сообщений
    const unreadMessageCount = await this.countUnreadMessages(chat.id, userId);

    return {
      id: chat.id,
      name: chat.name,
      lastMessage: lastMessageData,
      unreadMessageCount,
    };
  }));

  return chatData;
}
  
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


    async addUserToChat(chatId: number, userId:number,): Promise<any> {
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
      // this.chatRepository.update({id: chatId}, { name: chat.name + ""})
      
      console.log(chatUser)
  const existingUsersInChat = await this.chatUsersRepository.find({
    select:{
      id: true,
      
    },
    where: {
      chat: { id: chatId },
    },
    relations: ['user'],
  });

    chat.name = chat.name + `, ${user.firstName}${" "}${user.lastName}`;
   
  if (chat.name.length > 45){
    chat.name = chat.name.substring(0, 45);
  }
  await this. chatRepository.update({ id: chatId}, {name: chat.name } )

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

  async countUnreadMessages(chatId: number, userId: number): Promise<number> {
  const chatUser = await this.chatUsersRepository.findOne({
    where: {
      chat: { id: chatId },
      user: { id: userId },
    },
    relations: ['lastMessage']
  });

  if (!chatUser) {
    throw new BadRequestException("User not found in this chat");
  }
  const lastReadMessageId = chatUser.lastMessage?.id;
  
  if (!lastReadMessageId) {
    return 0;
  }

  const unreadMessagesCount = await this.messageRepository.count({
    where: {
      chat: { id: chatId },
      id: MoreThan(lastReadMessageId),
    },
  });

  return unreadMessagesCount;
};
 
async deleteUserFromChat(chatId: number, userId: number, userInitiator: number ){
   const existUser = await this.userRepository.findOne({where:{id: userInitiator}})
   if (!existUser){
    throw new BadRequestException("User not fond");
   }
   const existUserInChat = await this.chatUsersRepository.findOne({where: {user: {id: userInitiator}}});
   if (!existUserInChat){
    throw new BadRequestException("User not exist in this chat");
   }
  const chat = await this.chatRepository.findOne({where: {id: chatId}});
  if (!chat){
    throw new BadRequestException("Chat not foud")
  }
  const chatUser = await this.chatUsersRepository.findOne({
    where:{ id: userId, chat: {id: chatId}}
  })
  if (!chatUser){ 
    throw new BadRequestException("User not found")
  }
  await this.chatUsersRepository.delete(chatUser.id);
  throw new BadRequestException("User successfuly deleted");

}
async leftChat(chatId: number, userInitiator: number ){
  const existUser = await this.userRepository.findOne({where:{id: userInitiator}})
  if (!existUser){
   throw new BadRequestException("User not fond");
  }
  const existUserInChat = await this.chatUsersRepository.findOne({where: {user: {id: userInitiator}}});
  if (!existUserInChat){
   throw new BadRequestException("User not exist in this chat");
  }
 const chat = await this.chatRepository.findOne({where: {id: chatId}});
 if (!chat){
   throw new BadRequestException("Chat not foud")
 }
  const res = await this.chatUsersRepository.update({chat:{id: chatId}, user: {id: userInitiator}},{isLeft: true})
  console.log(res);
  console.log(userInitiator)
  console.log(chatId)
  console.log(chat)
 throw new BadRequestException("Chat successfuly deleted");
}
}

function getRawMany() {
  throw new Error('Function not implemented.');
}
