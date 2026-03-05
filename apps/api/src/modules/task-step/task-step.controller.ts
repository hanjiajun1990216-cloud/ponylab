import {
  Controller,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { TaskStepService } from "./task-step.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { PermissionGuard } from "../../common/guards/permission.guard";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";

@ApiTags("Task Steps")
@ApiBearerAuth()
@UseGuards(AuthGuard("jwt"), PermissionGuard)
@Controller("tasks/:taskId/steps")
export class TaskStepController {
  constructor(private taskStepService: TaskStepService) {}

  @Post()
  @RequirePermission("project:create")
  @ApiOperation({ summary: "Create a task step" })
  async create(
    @Param("taskId") taskId: string,
    @Body()
    body: {
      title: string;
      description?: string;
      assigneeId?: string;
      dueDate?: string;
      notes?: string;
    },
  ) {
    return this.taskStepService.create(taskId, body);
  }

  @Patch(":stepId")
  @RequirePermission("project:create")
  @ApiOperation({ summary: "Update task step (status, content, assignee)" })
  async update(
    @Param("taskId") taskId: string,
    @Param("stepId") stepId: string,
    @Body()
    body: {
      title?: string;
      description?: string;
      status?: string;
      assigneeId?: string;
      dueDate?: string | null;
      notes?: string;
    },
    @CurrentUser("id") userId: string,
  ) {
    return this.taskStepService.update(taskId, stepId, userId, body);
  }

  @Delete(":stepId")
  @RequirePermission("project:create")
  @ApiOperation({ summary: "Delete a task step" })
  async delete(
    @Param("taskId") taskId: string,
    @Param("stepId") stepId: string,
  ) {
    return this.taskStepService.delete(taskId, stepId);
  }

  @Post("reorder")
  @RequirePermission("project:create")
  @ApiOperation({ summary: "Reorder task steps" })
  async reorder(
    @Param("taskId") taskId: string,
    @Body() body: { orderedIds: string[] },
  ) {
    return this.taskStepService.reorder(taskId, body.orderedIds);
  }
}
