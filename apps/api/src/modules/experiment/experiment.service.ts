import * as bcrypt from "bcrypt";
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

    // 21 CFR Part 11: locked experiments cannot be modified
    if ((experiment as any).lockedAt) {
      throw new ForbiddenException(
        "Experiment is locked and cannot be modified",
      );
    }

    if (["SIGNED", "WITNESSED", "ARCHIVED"].includes(experiment.status)) {
      throw new ForbiddenException("Cannot modify experiment in this status");
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

  async sign(id: string, userId: string, password: string) {
    // Verify user's password for 21 CFR Part 11 compliance
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("User not found");

    const isValid = await bcrypt.compare(password, (user as any).passwordHash);
    if (!isValid)
      throw new ForbiddenException(
        "Invalid password — electronic signature requires identity verification",
      );

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
        newValue: { signedAt: signed.signedAt, passwordVerified: true },
      },
    });

    return signed;
  }

  async submit(id: string, userId: string) {
    const experiment = await this.prisma.experiment.findUnique({
      where: { id },
    });
    if (!experiment) throw new NotFoundException("Experiment not found");
    if (experiment.status !== "COMPLETED") {
      throw new ForbiddenException(
        "Only COMPLETED experiments can be submitted",
      );
    }

    const submitted = await this.prisma.experiment.update({
      where: { id },
      data: { status: "SUBMITTED" },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: "SUBMIT",
        entityType: "Experiment",
        entityId: id,
        newValue: { status: "SUBMITTED", submittedAt: new Date() },
      },
    });

    return submitted;
  }

  async witness(id: string, witnessId: string, password: string) {
    // Verify witness password for 21 CFR Part 11 compliance
    const user = await this.prisma.user.findUnique({
      where: { id: witnessId },
    });
    if (!user) throw new NotFoundException("User not found");

    const isValid = await bcrypt.compare(password, (user as any).passwordHash);
    if (!isValid)
      throw new ForbiddenException(
        "Invalid password — electronic signature requires identity verification",
      );

    const experiment = await this.prisma.experiment.findUnique({
      where: { id },
    });
    if (!experiment) throw new NotFoundException("Experiment not found");
    if (experiment.status !== "SIGNED") {
      throw new ForbiddenException("Only SIGNED experiments can be witnessed");
    }
    if (experiment.signedBy === witnessId) {
      throw new ForbiddenException("Witness must be different from the signer");
    }

    const witnessed = await this.prisma.experiment.update({
      where: { id },
      data: {
        status: "WITNESSED",
        witnessedAt: new Date(),
        witnessedBy: witnessId,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: witnessId,
        action: "WITNESS",
        entityType: "Experiment",
        entityId: id,
        newValue: {
          witnessedAt: witnessed.witnessedAt,
          passwordVerified: true,
        },
      },
    });

    return witnessed;
  }

  async reject(id: string, userId: string, reason: string) {
    const experiment = await this.prisma.experiment.findUnique({
      where: { id },
    });
    if (!experiment) throw new NotFoundException("Experiment not found");
    if (!["SUBMITTED", "SIGNED"].includes(experiment.status)) {
      throw new ForbiddenException(
        "Only SUBMITTED or SIGNED experiments can be rejected",
      );
    }

    const rejected = await this.prisma.experiment.update({
      where: { id },
      data: {
        status: "REJECTED",
        rejectReason: reason,
        rejectedAt: new Date(),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: "REJECT",
        entityType: "Experiment",
        entityId: id,
        newValue: { rejectReason: reason, rejectedAt: rejected.rejectedAt },
      },
    });

    return rejected;
  }

  async archive(id: string, userId: string) {
    const experiment = await this.prisma.experiment.findUnique({
      where: { id },
    });
    if (!experiment) throw new NotFoundException("Experiment not found");
    if (experiment.status !== "WITNESSED") {
      throw new ForbiddenException(
        "Only WITNESSED experiments can be archived",
      );
    }

    const archived = await this.prisma.experiment.update({
      where: { id },
      data: { status: "ARCHIVED" },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: "ARCHIVE",
        entityType: "Experiment",
        entityId: id,
        newValue: { status: "ARCHIVED", archivedAt: new Date() },
      },
    });

    return archived;
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
