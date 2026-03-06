import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody } from "@nestjs/swagger";
import { ProtocolExecutionService } from "./protocol-execution.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { PermissionGuard } from "../../common/guards/permission.guard";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";

@ApiTags("Protocol Execution")
@ApiBearerAuth()
@UseGuards(AuthGuard("jwt"), PermissionGuard)
@Controller()
export class ProtocolExecutionController {
  constructor(
    private readonly protocolExecutionService: ProtocolExecutionService,
  ) {}

  @Post("tasks/:taskId/protocol-execution")
  @RequirePermission("experiment:write")
  @ApiOperation({ summary: "Start protocol execution for a task" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        protocolId: { type: "string" },
        versionId: { type: "string" },
      },
      required: ["protocolId", "versionId"],
    },
  })
  startExecution(
    @Param("taskId") taskId: string,
    @Body() body: { protocolId: string; versionId: string },
    @CurrentUser("id") userId: string,
  ) {
    return this.protocolExecutionService.startExecution(
      taskId,
      body.protocolId,
      body.versionId,
      userId,
    );
  }

  @Get("tasks/:taskId/protocol-execution")
  @ApiOperation({ summary: "Get protocol execution for a task" })
  findByTask(@Param("taskId") taskId: string) {
    return this.protocolExecutionService.findByTask(taskId);
  }

  @Patch("protocol-executions/:id/steps/:stepId")
  @RequirePermission("experiment:write")
  @ApiOperation({ summary: "Update a protocol execution step" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["PENDING", "IN_PROGRESS", "COMPLETED", "SKIPPED"],
        },
        notes: { type: "string" },
        deviations: { type: "string" },
      },
    },
  })
  updateStep(
    @Param("id") executionId: string,
    @Param("stepId") stepId: string,
    @Body() body: { status?: string; notes?: string; deviations?: string },
    @CurrentUser("id") userId: string,
  ) {
    return this.protocolExecutionService.updateStep(
      executionId,
      stepId,
      body,
      userId,
    );
  }

  @Post("protocol-executions/:id/complete")
  @RequirePermission("experiment:write")
  @ApiOperation({ summary: "Complete a protocol execution" })
  completeExecution(@Param("id") executionId: string) {
    return this.protocolExecutionService.completeExecution(executionId);
  }
}
