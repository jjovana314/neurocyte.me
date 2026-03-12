import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { User } from './entites/user.entity';
import { PinoLogger } from 'nestjs-pino';
import { IRole, IRoles } from './interfaces/roles.interface';
import { Role } from './entites/role.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserInfo } from './interfaces/user-info.interface';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UserService,
    @InjectRepository(Role) private roleRepository: Repository<Role>,
    private jwtService: JwtService,
    private logger: PinoLogger
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }

  async login(user: User): Promise<UserInfo> {
    const payload = { email: user.email, role: user.role };
    return {
     accessToken: this.jwtService.sign(payload, { expiresIn: '1d' }),
      refreshToken: this.jwtService.sign(payload, { expiresIn: '7d' }),
    };
  }

  async register(email: string, password: string, firstName: string, lastName: string, role: IRole): Promise<UserInfo> {
  // todo crete use info data with access token
  const existingUser = await this.usersService.findUserByEmail(email);
    if (existingUser) {
      // todo: throw an error
      this.logger.error(`User with id ${existingUser.id} already exists`);
      return;
    }
    const user = new User();
    user.email = email;
    user.password = password;
    user.firstName = firstName;
    user.lastName = lastName;

    // const role = new Roles({ name: role.name, actions: role.actions});
    // todo: add method to fetch role from the database
    user.role = { name: role.name, actions: role.actions, id: 1};
    await user.hashPassword();
  
    await this.usersService.save(user);
    this.logger.info(`User with id ${user.id} registered successfully`);
    return await this.login(user);
  }
  
  async getRoles(name?: string, actions?: string[]): Promise<Role[]> {
    const query = this.roleRepository.createQueryBuilder('role');

    if (name) {
      query.where('role.name = :name', { name });
    }

    if (actions && actions.length > 0) {
      query.andWhere('role.actions && :actions', { actions });
    }

    return query.getMany();
  }
  // TODO: expose all roles from json file
}
