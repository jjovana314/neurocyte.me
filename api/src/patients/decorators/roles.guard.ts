import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import { UserService } from 'src/user/user.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }
    // find out why is this not working, jwt user is undefined
    const { user: jwtUser } = context.switchToHttp().getRequest();
    if (!jwtUser?.id) {
      throw new ForbiddenException('User not authenticated');
    }

    const user = await this.userService.findUserById(jwtUser.id);
    if (!user) {
      throw new ForbiddenException('User not found');
    }

    const userRole = user.role?.name?.toLowerCase();

    if (
      !userRole ||
      !requiredRoles.map((r) => r.toLowerCase()).includes(userRole)
    ) {
      throw new ForbiddenException(
        'Only doctors and researchers can export patient data',
      );
    }

    return true;
  }
}
