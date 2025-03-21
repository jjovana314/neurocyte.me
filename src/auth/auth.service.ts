import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { User } from './entites/user.entity';
import { PinoLogger } from 'nestjs-pino';
import { IRole, IRoles } from './interfaces/roles.interface';
import { Roles } from './entites/roles.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UserService,
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

  async login(user: any) {
    const payload = { email: user.email, role: user.role };
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }

  async register(email: string, password: string, firstName: string, lastName: string, role: IRole) {
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
    user.role = { name: role.name, actions: role.actions };
    await user.hashPassword();
  
    await this.usersService.save(user);
    this.logger.info(`User with id ${user.id} registered successfully`);
    return this.login(user);
  }
  
  async getRoles(): Promise<Roles> {

  }
  // TODO: expose all roles from json file
}
