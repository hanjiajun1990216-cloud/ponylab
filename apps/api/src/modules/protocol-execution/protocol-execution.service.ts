import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";

@Injectable()
export class ProtocolExecutionService {
  constructor(private prisma: PrismaService) {}

  async startExecution(
    taskId: string,
    protocolId: string,
    versionId: string,
    userId: string,
  ) {
    // Verify task exists
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      throw new NotFoundException(`Task ${taskId} not found`);
    }

    // Check if execution already exists for this task
    const existing = await this.prisma.protocolExecution.findUnique({
      where: { taskId },
    });
    if (existing) {
      throw new ConflictException(
        `Task ${taskId} already has a protocol execution`,
      );
    }

    // Verify protocol version exists and get content
    const version = await this.prisma.protocolVersion.findUnique({
      where: { id: versionId },
    });
    if (!version) {
      throw new NotFoundException(`Protocol version ${versionId} not found`);
    }

    // Extract steps from version content
    const content = version.content as any;
    const steps: any[] = Array.isArray(content?.steps) ? content.steps : [];

    // Create execution with steps in a transaction
    const execution = await this.prisma.$transaction(async (tx: any) => {
      const exec = await tx.protocolExecution.create({
        data: {
          taskId,
          protocolId,
          versionId,
        },
      });

      if (steps.length > 0) {
        await tx.protocolExecutionStep.createMany({
          data: steps.map((step: any, index: number) => ({
            executionId: exec.id,
            stepIndex: index,
            status: "PENDING",
            notes: null,
            deviations: null,
          })),
        });
      }

      await tx.auditLog.create({
        data: {
          userId,
          action: "CREATE",
          entityType: "ProtocolExecution",
          entityId: exec.id,
          newValue: { taskId, protocolId, versionId, stepCount: steps.length },
        },
      });

      return exec;
    });

    return this.findByTask(taskId);
  }

  async findByTask(taskId: string) {
    const execution = await this.prisma.protocolExecution.findUnique({
      where: { taskId },
      include: {
        steps: {
          orderBy: { stepIndex: "asc" },
          include: {
            executor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        protocol: {
          select: { id: true, name: true },
        },
      },
    });

    if (!execution) {
      throw new NotFoundException(
        `No protocol execution found for task ${taskId}`,
      );
    }

    return execution;
  }

  async updateStep(
    executionId: string,
    stepId: string,
    data: { status?: string; notes?: string; deviations?: string },
    userId: string,
  ) {
    // Verify step belongs to this execution
    const step = await this.prisma.protocolExecutionStep.findFirst({
      where: { id: stepId, executionId },
    });
    if (!step) {
      throw new NotFoundException(
        `Step ${stepId} not found in execution ${executionId}`,
      );
    }

    const updateData: any = {};
    if (data.status !== undefined) updateData.status = data.status;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.deviations !== undefined) updateData.deviations = data.deviations;

    // Set executedBy and executedAt when step reaches a terminal/active state
    if (
      data.status === "COMPLETED" ||
      data.status === "IN_PROGRESS" ||
      data.status === "SKIPPED"
    ) {
      updateData.executedBy = userId;
      updateData.executedAt = new Date();
    }

    return this.prisma.protocolExecutionStep.update({
      where: { id: stepId },
      data: updateData,
      include: {
        executor: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
  }

  async completeExecution(executionId: string) {
    const execution = await this.prisma.protocolExecution.findUnique({
      where: { id: executionId },
      include: { steps: true },
    });

    if (!execution) {
      throw new NotFoundException(`Execution ${executionId} not found`);
    }

    if (execution.completedAt) {
      throw new ConflictException("Execution is already completed");
    }

    // Validate all steps are COMPLETED or SKIPPED
    const incompleteSteps = execution.steps.filter(
      (s: any) => s.status !== "COMPLETED" && s.status !== "SKIPPED",
    );

    if (incompleteSteps.length > 0) {
      throw new BadRequestException(
        `Cannot complete execution: ${incompleteSteps.length} step(s) are not yet completed or skipped`,
      );
    }

    return this.prisma.protocolExecution.update({
      where: { id: executionId },
      data: { completedAt: new Date() },
      include: {
        steps: {
          orderBy: { stepIndex: "asc" },
        },
      },
    });
  }
}
