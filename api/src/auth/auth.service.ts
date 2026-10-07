import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { normalizeEmail, UserService } from 'src/user/user.service';
import { User } from '../user/entities/user.entity';
import { PinoLogger } from 'nestjs-pino';
import { IRoles } from './interfaces/roles.interface';
import { Role } from './entites/role.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserInfo } from './interfaces/user-info.interface';
import { Action } from './entites/action.entity';
import { config } from '../config/config';
import type { StringValue } from 'ms';
import { RegisterDto } from './dtos/register.dto';

export const USER_ALREADY_EXISTS_MESSAGE =
  'User with that email already exists';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UserService,
    @InjectRepository(Role) private roleRepository: Repository<Role>,
    @InjectRepository(Action) private actionRepository: Repository<Action>,
    private jwtService: JwtService,
    private logger: PinoLogger,
  ) {}

  async login(user: User): Promise<UserInfo> {
    const payload = { id: user.id, email: user.email, role: user.role };
    return {
      accessToken: this.jwtService.sign(payload, {
        expiresIn: config.get().ACCESS_TOKEN_TIME as StringValue,
      }),
      refreshToken: this.jwtService.sign(payload, {
        expiresIn: config.get().REFRESH_TOKEN_TIME as StringValue,
      }),
    };
  }

  async validateAndLogin(email: string, password: string): Promise<UserInfo> {
    const user = await this.usersService.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.login(user);
  }

  async register(registerData: RegisterDto): Promise<UserInfo> {
    const { password, firstName, lastName, role } = registerData;
    const email = normalizeEmail(registerData.email);
    if (!email) {
      throw new BadRequestException('Email is required');
    }

    // Any existing account with this email blocks registration, whatever its
    // role - we never fall through to creating a second account or logging in.
    const existingUser = await this.usersService.findUserByEmail(email);
    if (existingUser) {
      this.logger.error(`User with email ${existingUser.email} already exists`);
      throw new ConflictException(USER_ALREADY_EXISTS_MESSAGE);
    }
    const user = new User();
    user.email = email;
    user.password = password;
    user.firstName = firstName;
    user.lastName = lastName;

    const foundRole = await this.roleRepository.findOne({
      where: { name: role },
    });
    if (!foundRole) {
      throw new UnauthorizedException(`Role "${role}" does not exist`);
    }
    user.role = foundRole;
    this.logger.info('Creating user...');

    let savedUser: User;
    try {
      savedUser = await this.usersService.save(user);
    } catch (error) {
      // A concurrent registration with the same email can pass the check
      // above; the unique index on user.email then rejects the insert.
      if (error?.code === 'ER_DUP_ENTRY') {
        this.logger.error(`User with email ${email} already exists`);
        throw new ConflictException(USER_ALREADY_EXISTS_MESSAGE);
      }
      throw error;
    }
    this.logger.info(`User with id ${savedUser.id} registered successfully`);
    return await this.login(savedUser);
  }

  async forgotPassword(email: string): Promise<void> {
    await this.usersService.sendPasswordReset(email);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await this.usersService.resetPassword(token, newPassword);
  }

  async getRoles(name?: string, actions?: string[]): Promise<IRoles> {
    const query = this.roleRepository.createQueryBuilder('role');

    if (name) {
      query.where('role.name = :name', { name });
    }

    if (actions && actions.length > 0) {
      query.andWhere('role.actions && :actions', { actions });
    }
    const roles = await query.getMany();
    return { roles };
  }
}
