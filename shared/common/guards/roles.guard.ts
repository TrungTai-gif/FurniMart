import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
<<<<<<< HEAD

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Bạn không có quyền truy cập');
=======
import { ROLES_KEY } from '../decorators/roles.decorator';
import { IS_PUBLIC_KEY } from '../decorators/roles.decorator';
import { Role } from '../../config/rbac-matrix';

/**
 * Guard to enforce role-based access control
 * Checks if user's role is in the allowed roles for the endpoint
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {
    // Check if route is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Get required roles from decorator
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      // No roles specified - allow if authenticated
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const userRole = user.role as Role;
    const hasRole = requiredRoles.includes(userRole);

    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied. Required roles: [${requiredRoles.join(', ')}]. Your role: ${userRole}`,
      );
>>>>>>> nhung
    }

    return true;
  }
}
<<<<<<< HEAD

=======
>>>>>>> nhung
