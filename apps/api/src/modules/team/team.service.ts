import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { CreateTeamDto } from "./dto/create-team.dto";

const USER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  avatar: true,
  role: true,
  userColor: true,
} as const;

@Injectable()
export class TeamService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTeamDto, userId: string) {
    return this.prisma.team.create({
      data: {
        name: dto.name,
        description: dto.description,
        visibility: (dto as any).visibility ?? "CLOSED",
        members: {
          create: { userId, role: "OWNER" },
        },
      },
      include: {
        members: {
          include: { user: { select: USER_SELECT } },
        },
      },
    });
  }

  async findAll(userId: string, userRole?: string) {
    const where =
      userRole === "SUPER_ADMIN" ? {} : { members: { some: { userId } } };
    return this.prisma.team.findMany({
      where,
      include: {
        members: {
          include: { user: { select: USER_SELECT } },
        },
        _count: { select: { projects: true } },
      },
    });
  }

  async findById(id: string) {
    const team = await this.prisma.team.findUnique({
      where: { id },
      include: {
        members: {
          include: { user: { select: USER_SELECT } },
        },
        projects: true,
        _count: { select: { members: true, projects: true } },
      },
    });
    if (!team) throw new NotFoundException("Team not found");
    return team;
  }

  async update(
    id: string,
    data: {
      name?: string;
      description?: string;
      visibility?: any;
      avatar?: string;
    },
  ) {
    const team = await this.prisma.team.findUnique({ where: { id } });
    if (!team) throw new NotFoundException("Team not found");
    return this.prisma.team.update({ where: { id }, data });
  }

  async getMembers(id: string) {
    const team = await this.prisma.team.findUnique({ where: { id } });
    if (!team) throw new NotFoundException("Team not found");

    return this.prisma.teamMember.findMany({
      where: { teamId: id },
      include: { user: { select: USER_SELECT } },
      orderBy: { joinedAt: "asc" },
    });
  }

  async addMember(teamId: string, userId: string, role = "MEMBER" as const) {
    return this.prisma.teamMember.create({
      data: { teamId, userId, role },
      include: { user: { select: USER_SELECT } },
    });
  }

  async removeMember(teamId: string, userId: string) {
    return this.prisma.teamMember.delete({
      where: { teamId_userId: { teamId, userId } },
    });
  }
}
