import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { PinoLogger } from 'nestjs-pino';
import { User } from 'src/auth/entites/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(@InjectRepository(User) private userRepository: Repository<User>, private readonly logger: PinoLogger) {}

  async findUserByEmail(email: string): Promise<User | null> {
    this.logger.info('test');
    return await this.userRepository.findOne({ where: { email }});
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.findUserByEmail(email);
    if (user && await bcrypt.compare(password, password)) {
      return user;
    }
    return null;
  }

  async save(user: User): Promise<User> {
    const newUser =  this.userRepository.create(user);
    return await this.userRepository.save(newUser);
  }
}
