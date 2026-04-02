import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { PinoLogger } from 'nestjs-pino';
import { User } from 'src/auth/entites/user.entity';
import { Role } from 'src/auth/entites/role.entity';
import { Repository } from 'typeorm';
import { config } from 'src/config/config';
import { MailService } from './mail.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Role) private roleRepository: Repository<Role>,
    private readonly mailService: MailService,
    private readonly logger: PinoLogger,
  ) {}

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

  async remove(id: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return this.userRepository.remove(user);
  }

  async requestDeactivation(userId: number): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId }, relations: ['role'] });
    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    const token = randomUUID();
    user.deactivationToken = token;
    await this.userRepository.save(user);

    const admins = await this.userRepository.find({ where: { role: { name: 'admin' } }, relations: ['role'] });
    const deactivationLink = `${config.get().APP_URL}/user/deactivate/${token}`;
    const userName = `${user.firstName} ${user.lastName}`;

    for (const admin of admins) {
      await this.mailService.sendDeactivationEmail(admin.email, deactivationLink, userName);
    }
  }

  async removeByToken(token: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { deactivationToken: token } });
    if (!user) {
      throw new NotFoundException('Invalid or expired deactivation token');
    }
    return this.userRepository.remove(user);
  }
}
