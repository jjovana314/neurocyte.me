import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { PinoLogger } from 'nestjs-pino';
import { User } from '../auth/entites/user.entity';
import { Role } from '../auth/entites/role.entity';
import { Repository } from 'typeorm';
import { config } from '../config/config';
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
    return await this.userRepository.findOne({ where: { email } });
  }

  async findUserById(id: number): Promise<User | null> {
    return await this.userRepository.findOne({ where: { id } });
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['role'],
    });

    if (!user) {
      this.logger.error(`User not found with email: ${email}`);
      return null;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    this.logger.info(`Password validation result for ${email}: ${isMatch}`);

    if (isMatch) {
      this.logger.info(`User ${email} authenticated successfully`);
      return user;
    }

    this.logger.error(`Invalid password for user: ${email}`);
    return null;
  }

  async save(user: User): Promise<User> {
    const newUser = this.userRepository.create(user);
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
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['role'],
    });
    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    const token = randomUUID();
    user.deactivationToken = token;
    await this.userRepository.save(user);

    const admins = await this.userRepository.find({
      where: { role: { name: 'admin' } },
      relations: ['role'],
    });
    const deactivationLink = `${config.get().APP_URL}/user/deactivate/${token}`;
    const userName = `${user.firstName} ${user.lastName}`;

    for (const admin of admins) {
      await this.mailService.sendDeactivationEmail(
        admin.email,
        deactivationLink,
        userName,
      );
    }
  }

  async removeByToken(token: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { deactivationToken: token },
    });
    if (!user) {
      throw new NotFoundException('Invalid or expired deactivation token');
    }
    return this.userRepository.remove(user);
  }

  async sendPasswordReset(email: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { email } });
    // Always return silently to avoid revealing whether the email exists
    if (!user) return;

    const token = randomUUID();
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await this.userRepository.save(user);

    const resetLink = `${config.get().FRONTEND_URL}/reset-password?token=${token}`;
    await this.mailService.sendPasswordResetEmail(
      user.email,
      resetLink,
      `${user.firstName} ${user.lastName}`,
    );
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { resetPasswordToken: token },
    });
    if (!user || !user.resetPasswordExpires || user.resetPasswordExpires < Date.now()) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    const salt = await bcrypt.genSalt();
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await this.userRepository.save(user);
  }
}
