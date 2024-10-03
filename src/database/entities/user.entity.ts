import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Messages } from './messages.entity';
import { Chat } from './chat.entity';
import { ChatUsers } from './chatUsers.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  email: string;

  @Column()
  password: string;

  @Column ({default: true })
  isActive: boolean;

  @OneToMany (type  => Messages, message => message.user)
  messages: Messages[];

  @OneToMany (type  => ChatUsers, chatUsers => chatUsers.user)
  chatsUsers: ChatUsers[];

}
