import { AfterInsert, Column, CreateDateColumn, Entity, InsertEvent, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Chat } from './chat.entity';
import { User } from './user.entity';
import { ChatUsers } from './chatUsers.entity';

@Entity ()
export class Messages {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  text: string;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)" })
  createdAt: Date;

  @ManyToOne (type=> Chat , chat => chat.chatUsers)
  chat: Chat;

  @ManyToOne( type => ChatUsers, chatUser => chatUser.messages, { onDelete: 'CASCADE' })
  user: ChatUsers;
}

