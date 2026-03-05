import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "../decorators/roles.decorator";

/** Roles that bypass all role checks */
const SUPER_ROLES = ["SUPER_ADMIN"] as const;

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest();

    if (!user) return false;

    // SUPER_ADMIN bypasses all role restrictions
    if (SUPER_ROLES.includes(user.role as (typeof SUPER_ROLES)[number])) {
      return true;
    }

    return requiredRoles.includes(user.role);
  }
}
