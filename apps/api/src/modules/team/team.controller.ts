import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { TeamService } from "./team.service";
import { CreateTeamDto } from "./dto/create-team.dto";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { PermissionGuard } from "../../common/guards/permission.guard";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";

@ApiTags("Teams")
@ApiBearerAuth()
@UseGuards(AuthGuard("jwt"), PermissionGuard)
@Controller("teams")
export class TeamController {
  constructor(private teamService: TeamService) {}

  @Post()
  @ApiOperation({ summary: "Create a new team" })
  async create(@Body() dto: CreateTeamDto, @CurrentUser("id") userId: string) {
    return this.teamService.create(dto, userId);
  }

  @Get()
  @ApiOperation({
    summary: "List teams for current user (SUPER_ADMIN sees all)",
  })
  async findAll(@CurrentUser() user: { id: string; role: string }) {
    return this.teamService.findAll(user.id, user.role);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get team details" })
  async findById(@Param("id") id: string) {
    return this.teamService.findById(id);
  }

  @Patch(":id")
  @RequirePermission("team:manage")
  @ApiOperation({ summary: "Update team info (name, description, visibility)" })
  async update(
    @Param("id") id: string,
    @Body()
    body: {
      name?: string;
      description?: string;
      visibility?: string;
      avatar?: string;
    },
  ) {
    return this.teamService.update(id, body);
  }

  @Get(":id/members")
  @ApiOperation({ summary: "Get team member list with roles" })
  async getMembers(@Param("id") id: string) {
    return this.teamService.getMembers(id);
  }

  @Post(":id/members/:userId")
  @RequirePermission("team:manage")
  @ApiOperation({ summary: "Add member to team" })
  async addMember(
    @Param("id") teamId: string,
    @Param("userId") userId: string,
    @Body() body: { role?: string },
  ) {
    return this.teamService.addMember(
      teamId,
      userId,
      (body.role as any) ?? "MEMBER",
    );
  }

  @Delete(":id/members/:userId")
  @RequirePermission("team:manage")
  @ApiOperation({ summary: "Remove member from team" })
  async removeMember(
    @Param("id") teamId: string,
    @Param("userId") userId: string,
  ) {
    return this.teamService.removeMember(teamId, userId);
  }
}
