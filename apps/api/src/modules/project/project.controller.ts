import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { ProjectService } from "./project.service";
import { PermissionGuard } from "../../common/guards/permission.guard";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@ApiTags("Projects")
@ApiBearerAuth()
@UseGuards(AuthGuard("jwt"))
@Controller("projects")
export class ProjectController {
  constructor(private projectService: ProjectService) {}

  @Post()
  @ApiOperation({ summary: "Create a new project" })
  async create(
    @Body()
    body: {
      name: string;
      description?: string;
      teamId: string;
      directionId?: string;
      leadId?: string;
      startDate?: string;
      endDate?: string;
      priority?: number;
    },
  ) {
    return this.projectService.create(body);
  }

  @Get("team/:teamId")
  @ApiOperation({ summary: "List projects by team" })
  async findByTeam(
    @Param("teamId") teamId: string,
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("limit", new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.projectService.findByTeam(teamId, page, Math.min(limit, 100));
  }

  @Get("direction/:directionId")
  @ApiOperation({ summary: "List projects by research direction" })
  async findByDirection(@Param("directionId") directionId: string) {
    return this.projectService.findByDirection(directionId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get project details with tasks, experiments, comments, lead" })
  async findById(@Param("id") id: string) {
    return this.projectService.findById(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update project (includes directionId, leadId)" })
  async update(
    @Param("id") id: string,
    @Body()
    body: {
      name?: string;
      description?: string;
      status?: string;
      directionId?: string | null;
      leadId?: string | null;
      startDate?: string | null;
      endDate?: string | null;
      priority?: number;
    },
  ) {
    return this.projectService.update(id, body);
  }

  @Post(":id/tasks/reorder")
  @ApiOperation({ summary: "Reorder tasks within a project" })
  async reorderTasks(
    @Param("id") id: string,
    @Body() body: { orderedTaskIds: string[] },
  ) {
    return this.projectService.reorderTasks(id, body.orderedTaskIds);
  }

  @Delete(":id")
  @UseGuards(PermissionGuard)
  @RequirePermission("project:delete")
  @ApiOperation({ summary: "Delete project (requires ADMIN/PI/TEAM_OWNER)" })
  async delete(
    @Param("id") id: string,
    @CurrentUser() user: { id: string; role: string },
  ) {
    return this.projectService.delete(id);
  }
}
