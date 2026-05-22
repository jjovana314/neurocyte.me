import { AuthService } from './auth.service';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login({ email, password }: LoginDto): Promise<import("./interfaces/user-info.interface").UserInfo>;
    register({ email, password, firstName, lastName, role }: RegisterDto): Promise<{
        accessToken: string;
    }>;
    getRoles(name?: string, actions?: string[]): Promise<any>;
}
