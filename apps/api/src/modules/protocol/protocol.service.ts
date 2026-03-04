import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";

@Injectable()
export class ProtocolService {
  constructor(private prisma: PrismaService) {}

  async create(data: { name: string; description?: string; category?: string; content: any }, userId: string) {
    return this.prisma.protocol.create({
      data: {
        name: data.name,
        description: data.description,
        category: data.category,
        authorId: userId,
        versions: {
          create: { version: 1, content: data.content },
        },
      },
      include: { versions: true },
    });
  }

  async findAll(page = 1, limit = 20, category?: string) {
    const where = category ? { category } : {};
    const [data, total] = await Promise.all([
      this.prisma.protocol.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          author: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { versions: true } },
        },
        orderBy: { updatedAt: "desc" },
      }),
      this.prisma.protocol.count({ where }),
    ]);
    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string) {
    const protocol = await this.prisma.protocol.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, firstName: true, lastName: true } },
        versions: { orderBy: { version: "desc" } },
      },
    });
    if (!protocol) throw new NotFoundException("Protocol not found");
    return protocol;
  }

  async createVersion(protocolId: string, content: any, changelog?: string) {
    const latestVersion = await this.prisma.protocolVersion.findFirst({
      where: { protocolId },
      orderBy: { version: "desc" },
    });

    return this.prisma.protocolVersion.create({
      data: {
        protocolId,
        version: (latestVersion?.version ?? 0) + 1,
        content,
        changelog,
      },
    });
  }

  async publish(id: string) {
    return this.prisma.protocol.update({
      where: { id },
      data: { isPublished: true },
    });
  }
}
