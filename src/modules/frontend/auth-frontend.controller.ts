import { Controller, Get, Render } from '@nestjs/common';
import { Public } from '../auth/public-strategy';

@Controller('fe')
export class AuthFrontendController {
  constructor() {}

  @Public()
  @Get()
  @Render('auth/login')
  renderAuthPage() {
  }
}
