import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";

@Injectable()
export class InventoryColumnService {
  constructor(private prisma: PrismaService) {}

  async findByTeam(teamId: string) {
    return this.prisma.inventoryColumn.findMany({
      where: { teamId },
      orderBy: { sortOrder: "asc" },
    });
  }

  async create(data: {
    teamId: string;
    name: string;
    type: string;
    options?: any;
    isRequired?: boolean;
  }) {
    // Determine next sortOrder
    const last = await this.prisma.inventoryColumn.findFirst({
      where: { teamId: data.teamId },
      orderBy: { sortOrder: "desc" },
    });
    const sortOrder = last ? last.sortOrder + 1 : 0;

    return this.prisma.inventoryColumn.create({
      data: {
        teamId: data.teamId,
        name: data.name,
        type: data.type as any,
        options: data.options ?? undefined,
        isRequired: data.isRequired ?? false,
        sortOrder,
      },
    });
  }

  async delete(id: string, teamId: string) {
    const column = await this.prisma.inventoryColumn.findUnique({
      where: { id },
    });

    if (!column) {
      throw new NotFoundException(`列 ${id} 不存在`);
    }

    if (column.teamId !== teamId) {
      throw new NotFoundException(`列 ${id} 不存在`);
    }

    await this.prisma.inventoryColumn.delete({ where: { id } });

    return { success: true };
  }
}
