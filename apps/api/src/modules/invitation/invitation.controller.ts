import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { InvitationService } from "./invitation.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { PermissionGuard } from "../../common/guards/permission.guard";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";

@ApiTags("Invitations")
@ApiBearerAuth()
@UseGuards(AuthGuard("jwt"), PermissionGuard)
@Controller()
export class InvitationController {
  constructor(private invitationService: InvitationService) {}

  @Post("teams/:teamId/invitations")
  @RequirePermission("team:manage")
  @ApiOperation({ summary: "Create a team invitation (EMAIL/LINK/CODE)" })
  async create(
    @Param("teamId") teamId: string,
    @Body()
    body: {
      type: "EMAIL" | "LINK" | "CODE";
      email?: string;
      role?: string;
      maxUses?: number;
      expiresInDays?: number;
    },
    @CurrentUser("id") userId: string,
  ) {
    return this.invitationService.create(teamId, userId, body);
  }

  @Get("teams/:teamId/invitations")
  @ApiOperation({ summary: "List team invitations" })
  async findByTeam(@Param("teamId") teamId: string) {
    return this.invitationService.findByTeam(teamId);
  }

  @Delete("teams/:teamId/invitations/:id")
  @RequirePermission("team:manage")
  @ApiOperation({ summary: "Revoke an invitation" })
  async revoke(@Param("teamId") teamId: string, @Param("id") id: string) {
    return this.invitationService.revoke(teamId, id);
  }

  @Post("invitations/accept")
  @ApiOperation({ summary: "Accept an invitation by token or code" })
  async accept(
    @Body() body: { token?: string; code?: string },
    @CurrentUser("id") userId: string,
  ) {
    return this.invitationService.accept(userId, body);
  }
}
