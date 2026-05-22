import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { User } from './entites/user.entity';
import { PinoLogger } from 'nestjs-pino';
import { IRoles } from './interfaces/roles.interface';
import { Role } from './entites/role.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserInfo } from './interfaces/user-info.interface';
import { Action } from './entites/action.entity';

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
      accessToken: this.jwtService.sign(payload, { expiresIn: '1d' }),
      refreshToken: this.jwtService.sign(payload, { expiresIn: '7d' }),
    };
  }

  async validateAndLogin(email: string, password: string): Promise<UserInfo> {
    const user = await this.usersService.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.login(user);
  }

  async register(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    role: string,
  ): Promise<UserInfo> {
    // todo crete use info data with access token
    const existingUser = await this.usersService.findUserByEmail(email);
    if (existingUser) {
      this.logger.error(`User with email ${existingUser.email} already exists`);
      throw new BadRequestException(`User with email ${email} already exists`);
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

    await this.usersService.save(user);
    this.logger.info(`User with id ${user.id} registered successfully`);
    return await this.login(user);
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
