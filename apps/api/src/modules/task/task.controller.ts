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
import { PermissionGuard } from "../../common/guards/permission.guard";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@ApiTags("Tasks")
@ApiBearerAuth()
@UseGuards(AuthGuard("jwt"), PermissionGuard)
@Controller("tasks")
export class TaskController {
  constructor(private taskService: TaskService) {}

  @Get("project/:projectId")
  @ApiOperation({ summary: "List tasks by project" })
  async findByProject(@Param("projectId") projectId: string) {
    return this.taskService.findByProject(projectId);
  }

  @Get(":id")
  @ApiOperation({
    summary: "Get task details with steps, dependencies, comments",
  })
  async findById(@Param("id") id: string) {
    return this.taskService.findById(id);
  }

  @Post()
  @RequirePermission("project:create")
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
  @RequirePermission("project:create")
  @ApiOperation({
    summary: "Update task (status, assignee, description, etc.)",
  })
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
  @RequirePermission("experiment:write")
  @ApiOperation({ summary: "Add task dependency (DAG edge)" })
  async addDependency(
    @Param("id") taskId: string,
    @Body() body: { upstreamTaskId: string },
  ) {
    return this.taskService.addDependency(taskId, body.upstreamTaskId);
  }

  @Delete(":id/dependencies/:dependencyId")
  @RequirePermission("experiment:write")
  @ApiOperation({ summary: "Remove task dependency by dependency record ID" })
  async removeDependencyById(
    @Param("id") _taskId: string,
    @Param("dependencyId") dependencyId: string,
  ) {
    return this.taskService.removeDependencyById(dependencyId);
  }

  // ─── TaskParticipant endpoints ────────────────────────────────────────────

  @Post(":id/participants")
  @RequirePermission("experiment:write")
  @ApiOperation({ summary: "Add a participant to a task" })
  async addParticipant(
    @Param("id") taskId: string,
    @Body() body: { userId: string },
  ) {
    return this.taskService.addParticipant(taskId, body.userId);
  }

  @Delete(":id/participants/:userId")
  @RequirePermission("experiment:write")
  @ApiOperation({ summary: "Remove a participant from a task" })
  async removeParticipant(
    @Param("id") taskId: string,
    @Param("userId") userId: string,
  ) {
    return this.taskService.removeParticipant(taskId, userId);
  }

  @Get(":id/participants")
  @ApiOperation({ summary: "List participants of a task" })
  async listParticipants(@Param("id") taskId: string) {
    return this.taskService.listParticipants(taskId);
  }

  // ─── TaskInventoryUsage endpoints ─────────────────────────────────────────

  @Post(":id/inventory-usage")
  @RequirePermission("experiment:write")
  @ApiOperation({ summary: "Record inventory usage for a task" })
  async addInventoryUsage(
    @Param("id") taskId: string,
    @CurrentUser("id") userId: string,
    @Body() body: { inventoryItemId: string; quantity: number; unit: string },
  ) {
    return this.taskService.addInventoryUsage(taskId, userId, body);
  }

  @Get(":id/inventory-usage")
  @ApiOperation({ summary: "List inventory usage records for a task" })
  async listInventoryUsage(@Param("id") taskId: string) {
    return this.taskService.listInventoryUsage(taskId);
  }
}
