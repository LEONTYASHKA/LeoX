import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ChatUsers } from './chatUsers.entity';
import { Messages } from './messages.entity';

@Entity ()
  export class Chat {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @OneToMany (type => Messages, messages => messages.chat)
  messages: Messages[];

  @OneToMany (type => ChatUsers, chatUsers => chatUsers.chat)
  chatUsers: ChatUsers[];

}
