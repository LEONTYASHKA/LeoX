import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { RegisterDto } from '../auth/dtos/register.dto';
import { v4 as uuidv4 } from 'uuid';
import { UpdateDto } from '../profile/dtos/update.dto';

uuidv4();


@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  findOne(userId: number): Promise<User | null> {
    return this.usersRepository.findOneBy({ id: userId });
  }

  async remove(id: number): Promise<void> {
    await this.usersRepository.delete(id);
  }

  async createUser(user: RegisterDto) {
    console.log(JSON.stringify(user));

    const newUser = await this.usersRepository.create(user);
    console.log(newUser);
    await this.usersRepository.save(newUser);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ email: email });
  }

  async login(email: string, password: string): Promise<User>{
    const user = await  this.findByEmail(email)
    if (user && user.password === password){
      return user
    }
  }

  async getProfile(id: number): Promise<User> {
    return await this.usersRepository.findOneBy({ id });
  
  }
  async updateProfile(id: number, updateDto: UpdateDto){
    const user = await this.usersRepository.findOneBy({id});
    if (updateDto.email){
      const userExist  = await this.findByEmail(updateDto.email)

      if (userExist){
        throw new BadRequestException("user with this email already exists")
      }
      user.email = updateDto.email;
    }
    if (updateDto.firstName){
      user.firstName = updateDto.firstName;
    }
    if (updateDto.lastName){
      user.lastName = updateDto.lastName;
    }
    await this.usersRepository.save(user);
    return this.usersRepository.findOneBy({id});

  }
  async getUsers(id: number){

    const userWitId = await this.usersRepository.find({ select: ['id', 'firstName', 'lastName'], where: {id: Not(id)} });
    console.log(userWitId);
    return userWitId
  }

  async findUserByEmail (email: string) {
    const user = await this.usersRepository.findOne({ select: ['id', 'email', 'firstName', 'lastName'], where: {email}});
    if (!user){
      throw new BadRequestException("User not found");
    }
    return user;
  }
}