import { Controller, Get, Render } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './modules/auth/public-strategy';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

}
