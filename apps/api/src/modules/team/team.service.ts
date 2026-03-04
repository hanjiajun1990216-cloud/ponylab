import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { CreateTeamDto } from "./dto/create-team.dto";

@Injectable()
export class TeamService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTeamDto, userId: string) {
    return this.prisma.team.create({
      data: {
        name: dto.name,
        description: dto.description,
        members: {
          create: { userId, role: "OWNER" },
        },
      },
      include: { members: { include: { user: true } } },
    });
  }

  async findAll(userId: string) {
    return this.prisma.team.findMany({
      where: { members: { some: { userId } } },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
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
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
              },
            },
          },
        },
        projects: true,
      },
    });
    if (!team) throw new NotFoundException("Team not found");
    return team;
  }

  async addMember(teamId: string, userId: string, role = "MEMBER" as const) {
    return this.prisma.teamMember.create({
      data: { teamId, userId, role },
    });
  }

  async removeMember(teamId: string, userId: string) {
    return this.prisma.teamMember.delete({
      where: { teamId_userId: { teamId, userId } },
    });
  }
}
