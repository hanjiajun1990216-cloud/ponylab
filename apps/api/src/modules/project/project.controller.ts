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

@ApiTags("Projects")
@ApiBearerAuth()
@UseGuards(AuthGuard("jwt"))
@Controller("projects")
export class ProjectController {
  constructor(private projectService: ProjectService) {}

  @Post()
  @ApiOperation({ summary: "Create a new project" })
  async create(@Body() body: { name: string; description?: string; teamId: string }) {
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

  @Get(":id")
  @ApiOperation({ summary: "Get project details" })
  async findById(@Param("id") id: string) {
    return this.projectService.findById(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update project" })
  async update(@Param("id") id: string, @Body() body: { name?: string; description?: string }) {
    return this.projectService.update(id, body);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete project" })
  async delete(@Param("id") id: string) {
    return this.projectService.delete(id);
  }
}
