import { User } from 'src/auth/entites/user.entity';
import { UserService } from './user.service';
export declare class UserController {
    private readonly userService;
    constructor(userService: UserService);
    remove(id: number): Promise<User>;
    requestDeactivation(id: number): Promise<void>;
    deactivateByToken(token: string): Promise<User>;
}
