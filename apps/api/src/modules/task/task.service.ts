import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";

const USER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  avatar: true,
} as const;

@Injectable()
export class TaskService {
  constructor(private prisma: PrismaService) {}

  async findByProject(projectId: string) {
    return this.prisma.task.findMany({
      where: { projectId },
      include: {
        assignee: { select: USER_SELECT },
        lead: { select: USER_SELECT },
        steps: { orderBy: { sortOrder: "asc" } },
        dependsOn: { select: { upstreamTaskId: true } },
        dependedBy: { select: { dependentTaskId: true } },
      },
      orderBy: { sortOrder: "asc" },
    });
  }

  async findById(id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        assignee: { select: USER_SELECT },
        lead: { select: USER_SELECT },
        steps: { orderBy: { sortOrder: "asc" } },
        dependsOn: { select: { upstreamTaskId: true } },
        dependedBy: { select: { dependentTaskId: true } },
        comments: {
          where: { parentId: null },
          include: { author: { select: USER_SELECT } },
          orderBy: { createdAt: "asc" },
          take: 20,
        },
      },
    });
    if (!task) throw new NotFoundException("Task not found");
    return task;
  }

  async create(data: {
    title: string;
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
  }) {
    // Get next sortOrder
    const lastTask = await this.prisma.task.findFirst({
      where: { projectId: data.projectId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    return this.prisma.task.create({
      data: {
        title: data.title || data.name || "Untitled Task",
        description: data.description,
        projectId: data.projectId,
        assigneeId: data.assigneeId,
        leadId: data.leadId,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        priority: data.priority ?? 0,
        status: (data.status as any) ?? "TODO",
        isMilestone: data.isMilestone ?? false,
        color: data.color,
        sortOrder: (lastTask?.sortOrder ?? -1) + 1,
      },
      include: {
        assignee: { select: USER_SELECT },
        lead: { select: USER_SELECT },
      },
    });
  }

  async update(
    id: string,
    data: {
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
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) throw new NotFoundException("Task not found");

    return this.prisma.task.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        status: data.status as any,
        priority: data.priority,
        dueDate:
          data.dueDate === null
            ? null
            : data.dueDate
              ? new Date(data.dueDate)
              : undefined,
        assigneeId: data.assigneeId,
        leadId: data.leadId,
        isMilestone: data.isMilestone,
        color: data.color,
        sortOrder: data.sortOrder,
        completedAt:
          data.status === "DONE"
            ? new Date()
            : data.status && data.status !== "DONE"
              ? null
              : undefined,
      },
      include: {
        assignee: { select: USER_SELECT },
        lead: { select: USER_SELECT },
        steps: { orderBy: { sortOrder: "asc" } },
      },
    });
  }

  async updatePosition(id: string, x: number, y: number) {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) throw new NotFoundException("Task not found");
    return this.prisma.task.update({
      where: { id },
      data: { posX: x, posY: y },
    });
  }

  async addDependency(taskId: string, upstreamTaskId: string) {
    return this.prisma.taskDependency.create({
      data: { dependentTaskId: taskId, upstreamTaskId },
    });
  }

  async removeDependency(taskId: string, upstreamTaskId: string) {
    return this.prisma.taskDependency.delete({
      where: {
        dependentTaskId_upstreamTaskId: {
          dependentTaskId: taskId,
          upstreamTaskId,
        },
      },
    });
  }

  async removeDependencyById(dependencyId: string) {
    return this.prisma.taskDependency.delete({
      where: { id: dependencyId },
    });
  }

  // ─── TaskParticipant ──────────────────────────────────────────────────────

  async addParticipant(taskId: string, userId: string) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException("Task not found");
    return this.prisma.taskParticipant.create({
      data: { taskId, userId },
      include: { user: { select: USER_SELECT } },
    });
  }

  async removeParticipant(taskId: string, userId: string) {
    return this.prisma.taskParticipant.delete({
      where: { taskId_userId: { taskId, userId } },
    });
  }

  async listParticipants(taskId: string) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException("Task not found");
    return this.prisma.taskParticipant.findMany({
      where: { taskId },
      include: { user: { select: USER_SELECT } },
      orderBy: { addedAt: "asc" },
    });
  }

  // ─── TaskInventoryUsage ───────────────────────────────────────────────────

  async addInventoryUsage(
    taskId: string,
    userId: string,
    data: { inventoryItemId: string; quantity: number; unit: string },
  ) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException("Task not found");
    return this.prisma.taskInventoryUsage.create({
      data: {
        taskId,
        userId,
        inventoryItemId: data.inventoryItemId,
        quantity: data.quantity,
        unit: data.unit,
      },
      include: {
        item: { select: { id: true, name: true, category: true } },
        user: { select: USER_SELECT },
      },
    });
  }

  async listInventoryUsage(taskId: string) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException("Task not found");
    return this.prisma.taskInventoryUsage.findMany({
      where: { taskId },
      include: {
        item: { select: { id: true, name: true, category: true } },
        user: { select: USER_SELECT },
      },
      orderBy: { usedAt: "desc" },
    });
  }
}
