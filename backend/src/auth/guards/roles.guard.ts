import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private db: DatabaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true; // No roles required, access granted
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user; // Set by AuthGuard

    if (!user || !user.sub) {
      throw new ForbiddenException('User context is missing');
    }

    // Query database for user's roles
    const userWithRoles = await this.db.user.findUnique({
      where: { userID: user.sub },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!userWithRoles) {
      throw new ForbiddenException('User not found');
    }

    const userRoles = userWithRoles.userRoles.map(ur => ur.role.roleName);
    
    // Check if the user has any of the required roles
    const hasRole = requiredRoles.some((role) => userRoles.includes(role));
    
    if (!hasRole) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
