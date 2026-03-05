import { SetMetadata } from "@nestjs/common";
import { PERMISSION_KEY, PermissionAction } from "../guards/permission.guard";

export const RequirePermission = (action: PermissionAction) =>
  SetMetadata(PERMISSION_KEY, action);
