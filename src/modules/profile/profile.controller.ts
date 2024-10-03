import { BadRequestException, Body, Controller, Get, Patch, Req } from '@nestjs/common';
import { UserService } from '../users/user.service';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserInterface } from '../auth/interfaces/user.interface';
import { User } from '../auth/decorators/user.decorator';
import { UpdateDto } from './dtos/update.dto';


@Controller('profile')
export class ProfileController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getProfile(@User() user: UserInterface) {
    return this.userService.getProfile(user.sub);
  }

  @Patch()
  async updateProfile(@User() user: UserInterface, @Body() updateDto: UpdateDto){
    return this.userService.updateProfile(user.sub, updateDto);
  }

}

