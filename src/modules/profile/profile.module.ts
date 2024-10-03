import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { UserModule } from '../users/user.module';

@Module({
  imports: [UserModule],
  providers: [],
  controllers: [ProfileController],

})
export class ProfileModule {}
