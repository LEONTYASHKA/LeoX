import { Body, Controller, Get, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dtos/create-user.dto';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import { Public } from './public-strategy';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('registration')
  async createUser(@Body() registerDto: RegisterDto) {
    return this.authService.registration(registerDto);
  }

  @Public()
  @Post('login')
  async login (@Body() loginDto: LoginDto){
    return this.authService.login(loginDto)
  }

}
