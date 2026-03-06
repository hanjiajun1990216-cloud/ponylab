import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { CreateExperimentTemplateDto } from "./dto/create-template.dto";

@Injectable()
export class ExperimentTemplateService {
  constructor(private prisma: PrismaService) {}

  async findAll(teamId?: string, isPublic?: boolean) {
    const where: any = {};

    if (teamId && isPublic !== undefined) {
      // 当同时指定 teamId 和 isPublic 时，按 isPublic 过滤，但范围限制在该 team
      where.teamId = teamId;
      where.isPublic = isPublic;
    } else if (teamId) {
      // 显示指定 team 的模板，或公开模板
      where.OR = [{ teamId }, { isPublic: true }];
    } else if (isPublic !== undefined) {
      where.isPublic = isPublic;
    }

    return this.prisma.experimentTemplate.findMany({
      where,
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(id: string) {
    const template = await this.prisma.experimentTemplate.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!template) {
      throw new NotFoundException(`实验模板 ${id} 不存在`);
    }

    return template;
  }

  async create(dto: CreateExperimentTemplateDto, userId: string) {
    const template = await this.prisma.experimentTemplate.create({
      data: {
        name: dto.name,
        description: dto.description,
        content: dto.content ?? {},
        category: dto.category,
        isPublic: dto.isPublic ?? false,
        teamId: dto.teamId,
        authorId: userId,
      },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: "CREATE",
        entityType: "ExperimentTemplate",
        entityId: template.id,
        newValue: { name: template.name, teamId: template.teamId },
      },
    });

    return template;
  }

  async delete(id: string, userId: string) {
    const template = await this.prisma.experimentTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException(`实验模板 ${id} 不存在`);
    }

    if (template.authorId !== userId) {
      throw new ForbiddenException("只有模板作者才能删除该模板");
    }

    await this.prisma.experimentTemplate.delete({ where: { id } });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: "DELETE",
        entityType: "ExperimentTemplate",
        entityId: id,
        oldValue: { name: template.name },
      },
    });

    return { success: true };
  }
}
