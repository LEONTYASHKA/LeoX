import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Chat } from './chat.entity';
import { User } from './user.entity';
import { Messages } from './messages.entity';

@Entity ()
export class ChatUsers {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne (type => Chat, chat=> chat.chatUsers)
  chat: Chat;

  @ManyToOne (type => User, user => user.chatsUsers)
  user: User;

  @OneToMany (type => Messages, message => message.user)
  messages: Messages ;

  @ManyToOne(() => Messages, (messages) => messages.id)
  lastMessage: Messages;
}