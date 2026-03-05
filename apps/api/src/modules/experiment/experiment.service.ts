import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { CreateExperimentDto } from "./dto/create-experiment.dto";
import { UpdateExperimentDto } from "./dto/update-experiment.dto";

@Injectable()
export class ExperimentService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateExperimentDto, authorId: string) {
    const experiment = await this.prisma.experiment.create({
      data: {
        title: dto.title,
        content: dto.content ?? undefined,
        projectId: dto.projectId,
        authorId,
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: authorId,
        action: "CREATE",
        entityType: "Experiment",
        entityId: experiment.id,
        newValue: { title: experiment.title },
      },
    });

    return experiment;
  }

  async findByProject(projectId: string, page = 1, limit = 20) {
    const [data, total] = await Promise.all([
      this.prisma.experiment.findMany({
        where: { projectId },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          author: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { tasks: true, results: true, files: true } },
          tags: true,
        },
        orderBy: { updatedAt: "desc" },
      }),
      this.prisma.experiment.count({ where: { projectId } }),
    ]);
    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string) {
    const experiment = await this.prisma.experiment.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        project: { include: { team: true } },
        tasks: { orderBy: { priority: "desc" } },
        results: { orderBy: { createdAt: "desc" } },
        samples: true,
        files: true,
        tags: true,
      },
    });
    if (!experiment) throw new NotFoundException("Experiment not found");
    return experiment;
  }

  async update(id: string, dto: UpdateExperimentDto, userId: string) {
    const experiment = await this.prisma.experiment.findUnique({
      where: { id },
    });
    if (!experiment) throw new NotFoundException("Experiment not found");
    if (experiment.status === "SIGNED") {
      throw new ForbiddenException("Cannot modify a signed experiment");
    }

    // Create version snapshot before update
    const snapshotCount = await this.prisma.experimentSnapshot.count({
      where: { experimentId: id },
    });
    await this.prisma.experimentSnapshot.create({
      data: {
        experimentId: id,
        version: snapshotCount + 1,
        title: experiment.title,
        content: experiment.content ?? undefined,
        status: experiment.status,
        userId,
      },
    });

    const oldValue = { title: experiment.title, status: experiment.status };
    const updated = await this.prisma.experiment.update({
      where: { id },
      data: {
        title: dto.title,
        content: dto.content ?? undefined,
        status: dto.status,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: "UPDATE",
        entityType: "Experiment",
        entityId: id,
        oldValue,
        newValue: { title: updated.title, status: updated.status },
      },
    });

    return updated;
  }

  async sign(id: string, userId: string) {
    const experiment = await this.prisma.experiment.findUnique({
      where: { id },
    });
    if (!experiment) throw new NotFoundException("Experiment not found");
    if (experiment.status === "SIGNED") {
      throw new ForbiddenException("Experiment already signed");
    }

    const signed = await this.prisma.experiment.update({
      where: { id },
      data: {
        status: "SIGNED",
        signedAt: new Date(),
        signedBy: userId,
        lockedAt: new Date(),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: "SIGN",
        entityType: "Experiment",
        entityId: id,
        newValue: { signedAt: signed.signedAt },
      },
    });

    return signed;
  }

  async getHistory(id: string) {
    const experiment = await this.prisma.experiment.findUnique({
      where: { id },
    });
    if (!experiment) throw new NotFoundException("Experiment not found");

    return this.prisma.experimentSnapshot.findMany({
      where: { experimentId: id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { version: "desc" },
    });
  }

  async delete(id: string, userId: string) {
    const experiment = await this.prisma.experiment.findUnique({
      where: { id },
    });
    if (!experiment) throw new NotFoundException("Experiment not found");
    if (experiment.status === "SIGNED") {
      throw new ForbiddenException("Cannot delete a signed experiment");
    }

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: "DELETE",
        entityType: "Experiment",
        entityId: id,
        oldValue: { title: experiment.title },
      },
    });

    return this.prisma.experiment.delete({ where: { id } });
  }
}
