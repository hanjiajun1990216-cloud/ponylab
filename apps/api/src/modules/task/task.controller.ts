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
import { TaskService } from "./task.service";

@ApiTags("Tasks")
@ApiBearerAuth()
@UseGuards(AuthGuard("jwt"))
@Controller("tasks")
export class TaskController {
  constructor(private taskService: TaskService) {}

  @Get("project/:projectId")
  @ApiOperation({ summary: "List tasks by project" })
  async findByProject(@Param("projectId") projectId: string) {
    return this.taskService.findByProject(projectId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get task details with steps, dependencies, comments" })
  async findById(@Param("id") id: string) {
    return this.taskService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: "Create a new task" })
  async create(
    @Body()
    body: {
      title?: string;
      name?: string;
      projectId: string;
      description?: string;
      dueDate?: string;
      assigneeId?: string;
      leadId?: string;
      priority?: number;
      status?: string;
      isMilestone?: boolean;
      color?: string;
    },
  ) {
    return this.taskService.create({
      ...body,
      title: body.title || body.name || "Untitled Task",
    });
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update task (status, assignee, description, etc.)" })
  async update(
    @Param("id") id: string,
    @Body()
    body: {
      title?: string;
      description?: string;
      status?: string;
      priority?: number;
      dueDate?: string | null;
      assigneeId?: string | null;
      leadId?: string | null;
      isMilestone?: boolean;
      color?: string;
      sortOrder?: number;
    },
  ) {
    return this.taskService.update(id, body);
  }

  @Patch(":id/position")
  @ApiOperation({ summary: "Update task position on canvas (x, y)" })
  async updatePosition(
    @Param("id") id: string,
    @Body() body: { x: number; y: number },
  ) {
    return this.taskService.updatePosition(id, body.x, body.y);
  }

  @Post(":id/dependencies")
  @ApiOperation({ summary: "Add task dependency (DAG edge)" })
  async addDependency(
    @Param("id") taskId: string,
    @Body() body: { upstreamTaskId: string },
  ) {
    return this.taskService.addDependency(taskId, body.upstreamTaskId);
  }

  @Delete(":id/dependencies/:upstreamId")
  @ApiOperation({ summary: "Remove task dependency" })
  async removeDependency(
    @Param("id") taskId: string,
    @Param("upstreamId") upstreamId: string,
  ) {
    return this.taskService.removeDependency(taskId, upstreamId);
  }
}
