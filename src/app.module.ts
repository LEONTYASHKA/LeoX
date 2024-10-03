import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './database/entities/user.entity';
import { UserModule } from './modules/users/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProfileModule } from './modules/profile/profile.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { FrontendModule } from './modules/frontend/frontend.module';
import { Messages } from './database/entities/messages.entity';
import { Chat } from './database/entities/chat.entity';
import { ChatUsers } from './database/entities/chatUsers.entity';
import { MessageModule } from './modules/message/message.module';
import { ChatModule } from './modules/chat/chat.module';


@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'root',
      database: 'LeoX',
      entities: [User, Messages, Chat, ChatUsers],
      synchronize: true,
    }),
    UserModule,
    AuthModule,
    ProfileModule,
    FrontendModule,
    MessageModule,
    ChatModule,


  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
