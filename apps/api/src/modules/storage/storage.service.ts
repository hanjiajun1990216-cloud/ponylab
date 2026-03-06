import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";

// Build recursive include for up to 8 levels deep
function buildChildrenInclude(depth: number): any {
  if (depth <= 0) return true;
  return {
    include: {
      children: buildChildrenInclude(depth - 1),
      _count: { select: { samples: true } },
    },
  };
}

@Injectable()
export class StorageService {
  constructor(private prisma: PrismaService) {}

  async getTree() {
    return this.prisma.storageLocation.findMany({
      where: { parentId: null },
      include: {
        _count: { select: { samples: true } },
        children: {
          include: {
            _count: { select: { samples: true } },
            children: {
              include: {
                _count: { select: { samples: true } },
                children: {
                  include: {
                    _count: { select: { samples: true } },
                    children: {
                      include: {
                        _count: { select: { samples: true } },
                        children: {
                          include: {
                            _count: { select: { samples: true } },
                            children: {
                              include: {
                                _count: { select: { samples: true } },
                                children: {
                                  include: {
                                    _count: { select: { samples: true } },
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });
  }

  async create(data: {
    name: string;
    type: string;
    parentId?: string;
    temperature?: number;
    capacity?: number;
  }) {
    return this.prisma.storageLocation.create({
      data: {
        name: data.name,
        type: data.type as any,
        parentId: data.parentId ?? null,
        temperature: data.temperature ?? null,
        capacity: data.capacity ?? null,
      },
    });
  }

  async findById(id: string) {
    const location = await this.prisma.storageLocation.findUnique({
      where: { id },
      include: {
        children: true,
        _count: { select: { samples: true } },
      },
    });
    if (!location) throw new NotFoundException("Storage location not found");
    return location;
  }

  async getContents(id: string, page = 1, limit = 20) {
    const location = await this.prisma.storageLocation.findUnique({
      where: { id },
    });
    if (!location) throw new NotFoundException("Storage location not found");

    const [data, total] = await Promise.all([
      this.prisma.sample.findMany({
        where: { storageId: id },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          createdBy: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.sample.count({ where: { storageId: id } }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async delete(id: string) {
    const location = await this.prisma.storageLocation.findUnique({
      where: { id },
      include: {
        _count: { select: { children: true, samples: true } },
      },
    });

    if (!location) throw new NotFoundException("Storage location not found");

    if (location._count.children > 0) {
      throw new BadRequestException(
        "Cannot delete storage location with sub-locations",
      );
    }

    if (location._count.samples > 0) {
      throw new BadRequestException(
        "Cannot delete storage location that contains samples",
      );
    }

    return this.prisma.storageLocation.delete({ where: { id } });
  }
}
