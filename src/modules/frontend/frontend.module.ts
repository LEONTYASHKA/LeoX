import { Module } from '@nestjs/common';
import { AuthFrontendController } from './auth-frontend.controller';
import { FrontendService } from './frontend.service';


@Module({
  imports: [],
  controllers: [AuthFrontendController],
  providers: [FrontendService],
})
export class FrontendModule {}