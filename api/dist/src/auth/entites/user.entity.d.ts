import { Role } from './role.entity';
export declare class User {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    role: Role;
    deactivationToken: string | null;
    hashPassword(): Promise<void>;
    validatePassword(password: string): Promise<boolean>;
}
