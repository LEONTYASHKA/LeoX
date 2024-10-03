import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CreateUserDto } from './dtos/create-user.dto';
import { UserService } from './user.service';
import { User } from '../auth/decorators/user.decorator';
import { UserInterface } from '../auth/interfaces/user.interface';

@Controller('users')
export class UserController {
  constructor(private readonly usersService: UserService) {
  }

  @Get("find")
  async getUsers(@User() user: UserInterface) {
    return this.usersService.getUsers(user.sub)
  }

  @Get('search')
  async searchUserByEmail(@Query('email') email: string) {
    return this.usersService.findUserByEmail(email);
}

}