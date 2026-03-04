import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";

@Injectable()
export class ProjectService {
  constructor(private prisma: PrismaService) {}

  async create(data: { name: string; description?: string; teamId: string }) {
    return this.prisma.project.create({
      data,
      include: { team: true },
    });
  }

  async findByTeam(teamId: string, page = 1, limit = 20) {
    const [data, total] = await Promise.all([
      this.prisma.project.findMany({
        where: { teamId },
        skip: (page - 1) * limit,
        take: limit,
        include: { _count: { select: { experiments: true } } },
        orderBy: { updatedAt: "desc" },
      }),
      this.prisma.project.count({ where: { teamId } }),
    ]);
    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        team: true,
        experiments: { orderBy: { updatedAt: "desc" }, take: 20 },
      },
    });
    if (!project) throw new NotFoundException("Project not found");
    return project;
  }

  async update(id: string, data: { name?: string; description?: string; status?: any }) {
    return this.prisma.project.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.project.delete({ where: { id } });
  }
}
