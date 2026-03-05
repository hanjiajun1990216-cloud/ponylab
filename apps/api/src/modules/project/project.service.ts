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
export class ProjectService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    name: string;
    description?: string;
    teamId: string;
    directionId?: string;
    leadId?: string;
    startDate?: string;
    endDate?: string;
    priority?: number;
  }) {
    return this.prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        teamId: data.teamId,
        directionId: data.directionId,
        leadId: data.leadId,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        priority: data.priority ?? 0,
      },
      include: {
        team: true,
        lead: { select: USER_SELECT },
        direction: { select: { id: true, name: true } },
      },
    });
  }

  async findByTeam(teamId: string, page = 1, limit = 20) {
    const [data, total] = await Promise.all([
      this.prisma.project.findMany({
        where: { teamId },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          lead: { select: USER_SELECT },
          direction: { select: { id: true, name: true, color: true } },
          _count: { select: { experiments: true, tasks: true } },
        },
        orderBy: { updatedAt: "desc" },
      }),
      this.prisma.project.count({ where: { teamId } }),
    ]);
    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findByDirection(directionId: string) {
    return this.prisma.project.findMany({
      where: { directionId },
      include: {
        lead: { select: USER_SELECT },
        direction: { select: { id: true, name: true, color: true } },
        _count: { select: { experiments: true, tasks: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  async findById(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        team: true,
        lead: { select: USER_SELECT },
        direction: { select: { id: true, name: true, color: true } },
        experiments: { orderBy: { updatedAt: "desc" }, take: 20 },
        tasks: {
          orderBy: { sortOrder: "asc" },
          include: {
            assignee: { select: USER_SELECT },
            lead: { select: USER_SELECT },
          },
        },
        comments: {
          where: { parentId: null },
          include: { author: { select: USER_SELECT } },
          orderBy: [{ isPinned: "desc" }, { createdAt: "asc" }],
          take: 20,
        },
      },
    });
    if (!project) throw new NotFoundException("Project not found");
    return project;
  }

  async update(
    id: string,
    data: {
      name?: string;
      description?: string;
      status?: any;
      directionId?: string | null;
      leadId?: string | null;
      startDate?: string | null;
      endDate?: string | null;
      priority?: number;
    },
  ) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) throw new NotFoundException("Project not found");
    return this.prisma.project.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        status: data.status,
        directionId: data.directionId,
        leadId: data.leadId,
        startDate: data.startDate === null ? null : data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate === null ? null : data.endDate ? new Date(data.endDate) : undefined,
        priority: data.priority,
      },
    });
  }

  async reorderTasks(id: string, orderedTaskIds: string[]) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) throw new NotFoundException("Project not found");

    await this.prisma.$transaction(
      orderedTaskIds.map((taskId, index) =>
        this.prisma.task.update({
          where: { id: taskId },
          data: { sortOrder: index },
        }),
      ),
    );

    return this.prisma.task.findMany({
      where: { projectId: id },
      orderBy: { sortOrder: "asc" },
    });
  }

  async delete(id: string) {
    return this.prisma.project.delete({ where: { id } });
  }
}
