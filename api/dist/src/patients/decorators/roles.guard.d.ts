import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserService } from 'src/user/user.service';
export declare class RolesGuard implements CanActivate {
    private reflector;
    private userService;
    constructor(reflector: Reflector, userService: UserService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
