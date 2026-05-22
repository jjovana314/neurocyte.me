import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { User } from './entites/user.entity';
import { PinoLogger } from 'nestjs-pino';
import { IRoles } from './interfaces/roles.interface';
import { Role } from './entites/role.entity';
import { Repository } from 'typeorm';
import { UserInfo } from './interfaces/user-info.interface';
import { Action } from './entites/action.entity';
export declare class AuthService {
    private usersService;
    private roleRepository;
    private actionRepository;
    private jwtService;
    private logger;
    constructor(usersService: UserService, roleRepository: Repository<Role>, actionRepository: Repository<Action>, jwtService: JwtService, logger: PinoLogger);
    login(user: User): Promise<UserInfo>;
    validateAndLogin(email: string, password: string): Promise<UserInfo>;
    register(email: string, password: string, firstName: string, lastName: string, role: string): Promise<UserInfo>;
    getRoles(name?: string, actions?: string[]): Promise<IRoles>;
}
