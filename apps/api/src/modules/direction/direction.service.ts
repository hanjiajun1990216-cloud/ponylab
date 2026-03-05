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
export class DirectionService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    teamId: string;
    name: string;
    description?: string;
    leadId: string;
    color?: string;
  }) {
    return this.prisma.direction.create({
      data: {
        name: data.name,
        description: data.description,
        teamId: data.teamId,
        leadId: data.leadId,
        color: data.color,
      },
      include: {
        lead: { select: USER_SELECT },
        team: { select: { id: true, name: true } },
      },
    });
  }

  async findByTeam(teamId: string) {
    return this.prisma.direction.findMany({
      where: { teamId },
      include: {
        lead: { select: USER_SELECT },
        _count: { select: { projects: true } },
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
  }

  async findById(id: string) {
    const direction = await this.prisma.direction.findUnique({
      where: { id },
      include: {
        lead: { select: USER_SELECT },
        team: { select: { id: true, name: true } },
        projects: {
          include: {
            lead: { select: USER_SELECT },
            _count: { select: { experiments: true, tasks: true } },
          },
          orderBy: { updatedAt: "desc" },
        },
      },
    });
    if (!direction) throw new NotFoundException("Direction not found");
    return direction;
  }

  async update(
    id: string,
    data: {
      name?: string;
      description?: string;
      leadId?: string;
      status?: any;
      color?: string;
      sortOrder?: number;
    },
  ) {
    const direction = await this.prisma.direction.findUnique({ where: { id } });
    if (!direction) throw new NotFoundException("Direction not found");
    return this.prisma.direction.update({
      where: { id },
      data,
      include: { lead: { select: USER_SELECT } },
    });
  }

  async delete(id: string) {
    const direction = await this.prisma.direction.findUnique({ where: { id } });
    if (!direction) throw new NotFoundException("Direction not found");
    return this.prisma.direction.delete({ where: { id } });
  }
}
