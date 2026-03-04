import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";

@Injectable()
export class SampleService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    name: string;
    sampleType: string;
    barcode?: string;
    metadata?: any;
    storageId?: string;
    storagePosition?: string;
    experimentId?: string;
  }, userId: string) {
    const sample = await this.prisma.sample.create({
      data: { ...data, createdById: userId },
    });

    await this.prisma.sampleEvent.create({
      data: {
        sampleId: sample.id,
        type: "CREATED",
        userId,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: "CREATE",
        entityType: "Sample",
        entityId: sample.id,
        newValue: { name: sample.name, sampleType: sample.sampleType },
      },
    });

    return sample;
  }

  async findAll(page = 1, limit = 20, filters?: { sampleType?: string; status?: string }) {
    const where: any = {};
    if (filters?.sampleType) where.sampleType = filters.sampleType;
    if (filters?.status) where.status = filters.status;

    const [data, total] = await Promise.all([
      this.prisma.sample.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          storage: true,
          createdBy: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.sample.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string) {
    const sample = await this.prisma.sample.findUnique({
      where: { id },
      include: {
        storage: true,
        experiment: true,
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        events: {
          include: { user: { select: { id: true, firstName: true, lastName: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    if (!sample) throw new NotFoundException("Sample not found");
    return sample;
  }

  async addEvent(sampleId: string, type: string, userId: string, note?: string) {
    return this.prisma.sampleEvent.create({
      data: { sampleId, type: type as any, userId, note },
    });
  }

  async updateStatus(id: string, status: string, userId: string) {
    const sample = await this.prisma.sample.findUnique({ where: { id } });
    if (!sample) throw new NotFoundException("Sample not found");

    const updated = await this.prisma.sample.update({
      where: { id },
      data: { status: status as any },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: "UPDATE",
        entityType: "Sample",
        entityId: id,
        oldValue: { status: sample.status },
        newValue: { status: updated.status },
      },
    });

    return updated;
  }
}
