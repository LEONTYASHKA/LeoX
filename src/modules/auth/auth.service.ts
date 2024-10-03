import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../users/user.service';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import { JwtService } from '@nestjs/jwt';


@Injectable()
export class AuthService {

  constructor( private readonly jwtService: JwtService,
    private readonly usersService: UserService) {
  }

  async registration(registerDto: RegisterDto) {
    if (registerDto.password !== registerDto.confirmPassword) {
      throw new BadRequestException("Password is not the same");
    }
    const existEmail = await this.usersService.findByEmail(registerDto.email);
    if (existEmail) {
      throw new BadRequestException("User with this email already exists");
    }
    await this.usersService.createUser(registerDto);
    const user = await this.usersService.findByEmail(registerDto.email);
    console.log(JSON.stringify(user));
    const payload = { sub: user.id, email: user.email };
    return {access_token: await this.jwtService.signAsync(payload)}
  }

  async login(loginDto: LoginDto) {
    console.log(JSON.stringify(loginDto));
    const email = loginDto.email;
    const password = loginDto.password;
    // вызываем функцию на userService, которая проверяет есть ли юзер с такими даными
    const user = await this.usersService.login(email, password);
    if (!user) {
      throw new UnauthorizedException();
    }
    const payload = { sub: user.id, email: user.email };
    return {
      access_token: await this.jwtService.signAsync(payload),
      userId: user.id // для токена на фронте 
    }
  }
}

