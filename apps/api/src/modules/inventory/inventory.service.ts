import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    name: string;
    category: string;
    sku?: string;
    quantity: number;
    unit: string;
    minQuantity?: number;
    supplier?: string;
    catalogNumber?: string;
    expiryDate?: string;
    teamId?: string;
  }) {
    return this.prisma.inventoryItem.create({
      data: {
        ...data,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
      },
    });
  }

  async findAll(page = 1, limit = 20, filters?: { category?: string; lowStock?: boolean }) {
    const where: any = {};
    if (filters?.category) where.category = filters.category;
    if (filters?.lowStock) {
      // Select items where quantity <= minQuantity (and minQuantity is set)
      where.minQuantity = { not: null };
      // We handle the quantity <= minQuantity comparison via raw query in getLowStockItems,
      // but for the paginated list we apply a reasonable approximation:
      where.AND = [
        { minQuantity: { not: null } },
        // Prisma doesn't support column-to-column comparison; use raw for that use case
        // For now, return all items with minQuantity set so caller can filter client-side
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.inventoryItem.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { updatedAt: "desc" },
      }),
      this.prisma.inventoryItem.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string) {
    const item = await this.prisma.inventoryItem.findUnique({
      where: { id },
      include: {
        logs: {
          include: { user: { select: { id: true, firstName: true, lastName: true } } },
          orderBy: { createdAt: "desc" },
          take: 50,
        },
      },
    });
    if (!item) throw new NotFoundException("Inventory item not found");
    return item;
  }

  async adjustQuantity(
    id: string,
    action: "IN" | "OUT" | "ADJUST",
    amount: number,
    userId: string,
    reason?: string,
  ) {
    const item = await this.prisma.inventoryItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException("Inventory item not found");

    const quantityBefore = item.quantity;
    let quantityAfter: number;

    switch (action) {
      case "IN":
        quantityAfter = quantityBefore + amount;
        break;
      case "OUT":
        quantityAfter = quantityBefore - amount;
        if (quantityAfter < 0) throw new BadRequestException("Insufficient stock");
        break;
      case "ADJUST":
        quantityAfter = amount;
        break;
    }

    // BUG-003 fix: ensure both quantity update and log creation are inside the transaction
    await this.prisma.$transaction([
      this.prisma.inventoryItem.update({
        where: { id },
        data: { quantity: quantityAfter },
      }),
      this.prisma.inventoryLog.create({
        data: { itemId: id, action, quantityBefore, quantityAfter, reason, userId },
      }),
      this.prisma.auditLog.create({
        data: {
          userId,
          action: "INVENTORY_ADJUST",
          entityType: "InventoryItem",
          entityId: id,
          oldValue: { quantity: quantityBefore },
          newValue: { quantity: quantityAfter, action, reason },
        },
      }),
    ]);

    return { id, quantityBefore, quantityAfter, action };
  }

  async getLowStockItems() {
    return this.prisma.$queryRaw`
      SELECT * FROM inventory_items
      WHERE min_quantity IS NOT NULL AND quantity <= min_quantity
      ORDER BY (quantity / NULLIF(min_quantity, 0)) ASC
    `;
  }
}
