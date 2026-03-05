import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PrismaService } from "../prisma/prisma.service";

export const PERMISSION_KEY = "require_permission";

export type PermissionAction =
  | "project:delete"
  | "project:create"
  | "team:manage"
  | "instrument:admin"
  | "inventory:admin"
  | "experiment:write"
  | "direction:manage"
  | "announcement:manage";

/** Roles that are always allowed regardless of team context */
const SUPER_ROLES = ["SUPER_ADMIN", "ADMIN"] as const;

/** Team roles that are allowed for a given action */
const TEAM_ROLE_PERMISSIONS: Record<PermissionAction, string[]> = {
  "project:delete": ["OWNER", "ADMIN"],
  "project:create": ["OWNER", "ADMIN", "PROJECT_LEAD", "MEMBER"],
  "team:manage": ["OWNER", "ADMIN"],
  "instrument:admin": ["OWNER", "ADMIN"],
  "inventory:admin": ["OWNER", "ADMIN"],
  "experiment:write": ["OWNER", "ADMIN", "MEMBER"],
  "direction:manage": ["OWNER", "ADMIN"],
  "announcement:manage": ["OWNER", "ADMIN"],
};

/** System user roles that are always allowed */
const USER_ROLE_PERMISSIONS: Record<PermissionAction, string[]> = {
  "project:delete": ["SUPER_ADMIN", "ADMIN", "PI"],
  "project:create": ["SUPER_ADMIN", "ADMIN", "PI", "RESEARCHER"],
  "team:manage": ["SUPER_ADMIN", "ADMIN"],
  "instrument:admin": ["SUPER_ADMIN", "ADMIN"],
  "inventory:admin": ["SUPER_ADMIN", "ADMIN"],
  "experiment:write": ["SUPER_ADMIN", "ADMIN", "PI", "RESEARCHER"],
  "direction:manage": ["SUPER_ADMIN", "ADMIN", "PI"],
  "announcement:manage": ["SUPER_ADMIN", "ADMIN"],
};

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission =
      this.reflector.getAllAndOverride<PermissionAction>(PERMISSION_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);

    if (!requiredPermission) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) throw new ForbiddenException("Unauthenticated");

    // Check system-level user role first
    const allowedUserRoles = USER_ROLE_PERMISSIONS[requiredPermission] ?? [];
    if (allowedUserRoles.includes(user.role)) return true;

    // Try to resolve teamId from route params or body
    const teamId =
      request.params?.teamId ?? request.body?.teamId ?? request.query?.teamId;

    // If no teamId available, deny
    if (!teamId) throw new ForbiddenException("Insufficient permissions");

    // Check team membership role
    const membership = await this.prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: user.id } },
    });

    if (!membership) throw new ForbiddenException("Not a member of this team");

    const allowedTeamRoles = TEAM_ROLE_PERMISSIONS[requiredPermission] ?? [];
    if (allowedTeamRoles.includes(membership.role)) return true;

    // Also check functional roles for instrument/inventory admin
    if (
      requiredPermission === "instrument:admin" ||
      requiredPermission === "inventory:admin"
    ) {
      const functionalRoleType =
        requiredPermission === "instrument:admin"
          ? "INSTRUMENT_ADMIN"
          : "INVENTORY_ADMIN";

      const funcRole = await this.prisma.functionalRole.findFirst({
        where: { userId: user.id, teamId, role: functionalRoleType },
      });
      if (funcRole) return true;
    }

    throw new ForbiddenException("Insufficient permissions");
  }
}
