import { PinoLogger } from 'nestjs-pino';
import { User } from '../auth/entites/user.entity';
import { Role } from '../auth/entites/role.entity';
import { Repository } from 'typeorm';
import { MailService } from './mail.service';
export declare class UserService {
    private userRepository;
    private roleRepository;
    private readonly mailService;
    private readonly logger;
    constructor(userRepository: Repository<User>, roleRepository: Repository<Role>, mailService: MailService, logger: PinoLogger);
    findUserByEmail(email: string): Promise<User | null>;
    findUserById(id: number): Promise<User | null>;
    validateUser(email: string, password: string): Promise<User | null>;
    save(user: User): Promise<User>;
    remove(id: number): Promise<User>;
    requestDeactivation(userId: number): Promise<void>;
    removeByToken(token: string): Promise<User>;
}
