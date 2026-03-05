import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";

@Injectable()
export class TaskStepService {
  constructor(private prisma: PrismaService) {}

  async create(
    taskId: string,
    data: {
      title: string;
      description?: string;
      assigneeId?: string;
      dueDate?: string;
      notes?: string;
    },
  ) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException("Task not found");

    // Determine next sortOrder
    const lastStep = await this.prisma.taskStep.findFirst({
      where: { taskId },
      orderBy: { sortOrder: "desc" },
    });
    const sortOrder = lastStep ? lastStep.sortOrder + 1 : 0;

    return this.prisma.taskStep.create({
      data: {
        taskId,
        title: data.title,
        description: data.description,
        assigneeId: data.assigneeId,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        notes: data.notes,
        sortOrder,
      },
      include: {
        assignee: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async update(
    taskId: string,
    stepId: string,
    userId: string,
    data: {
      title?: string;
      description?: string;
      status?: any;
      assigneeId?: string;
      dueDate?: string | null;
      notes?: string;
    },
  ) {
    const step = await this.prisma.taskStep.findFirst({
      where: { id: stepId, taskId },
    });
    if (!step) throw new NotFoundException("Task step not found");

    const isCompleting =
      data.status === "COMPLETED" && step.status !== "COMPLETED";

    return this.prisma.taskStep.update({
      where: { id: stepId },
      data: {
        title: data.title,
        description: data.description,
        status: data.status,
        assigneeId: data.assigneeId,
        dueDate:
          data.dueDate === null
            ? null
            : data.dueDate
              ? new Date(data.dueDate)
              : undefined,
        notes: data.notes,
        completedAt: isCompleting ? new Date() : undefined,
        completedBy: isCompleting ? userId : undefined,
      },
      include: {
        assignee: { select: { id: true, firstName: true, lastName: true } },
        completer: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async delete(taskId: string, stepId: string) {
    const step = await this.prisma.taskStep.findFirst({
      where: { id: stepId, taskId },
    });
    if (!step) throw new NotFoundException("Task step not found");
    return this.prisma.taskStep.delete({ where: { id: stepId } });
  }

  async reorder(taskId: string, orderedIds: string[]) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException("Task not found");

    await this.prisma.$transaction(
      orderedIds.map((id, index) =>
        this.prisma.taskStep.update({
          where: { id },
          data: { sortOrder: index },
        }),
      ),
    );

    return this.prisma.taskStep.findMany({
      where: { taskId },
      orderBy: { sortOrder: "asc" },
    });
  }
}
