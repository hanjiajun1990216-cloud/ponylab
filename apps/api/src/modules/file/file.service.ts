import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { randomUUID } from "crypto";

@Injectable()
export class FileService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    originalName: string;
    mimeType: string;
    size: number;
    experimentId?: string;
    resultId?: string;
  }, userId: string) {
    const filename = `${randomUUID()}-${data.originalName}`;
    const storagePath = `uploads/${new Date().toISOString().slice(0, 7)}/${filename}`;

    return this.prisma.fileAttachment.create({
      data: {
        filename,
        originalName: data.originalName,
        mimeType: data.mimeType,
        size: data.size,
        storagePath,
        experimentId: data.experimentId,
        resultId: data.resultId,
        uploadedById: userId,
      },
    });
  }

  async findByExperiment(experimentId: string) {
    return this.prisma.fileAttachment.findMany({
      where: { experimentId },
      include: {
        uploadedBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(id: string) {
    const file = await this.prisma.fileAttachment.findUnique({ where: { id } });
    if (!file) throw new NotFoundException("File not found");
    return file;
  }

  async delete(id: string) {
    const file = await this.prisma.fileAttachment.findUnique({ where: { id } });
    if (!file) throw new NotFoundException("File not found");
    // TODO: Also delete from MinIO/S3
    return this.prisma.fileAttachment.delete({ where: { id } });
  }
}
