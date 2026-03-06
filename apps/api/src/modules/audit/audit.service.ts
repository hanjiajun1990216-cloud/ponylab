import * as crypto from "crypto";
import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    page = 1,
    limit = 50,
    filters?: {
      entityType?: string;
      entityId?: string;
      userId?: string;
      action?: string;
      from?: string;
      to?: string;
    },
  ) {
    const where: any = {};
    if (filters?.entityType) where.entityType = filters.entityType;
    if (filters?.entityId) where.entityId = filters.entityId;
    if (filters?.userId) where.userId = filters.userId;
    if (filters?.action) where.action = filters.action;
    if (filters?.from || filters?.to) {
      where.createdAt = {};
      if (filters.from) where.createdAt.gte = new Date(filters.from);
      if (filters.to) where.createdAt.lte = new Date(filters.to);
    }

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * BUG-006 fix: entity query must explicitly validate and apply both
   * entityType + entityId filters to prevent full-table scan when
   * parameters are missing or empty strings.
   */
  async findByEntity(entityType: string, entityId: string) {
    if (!entityType || !entityType.trim()) {
      throw new BadRequestException("entityType is required");
    }
    if (!entityId || !entityId.trim()) {
      throw new BadRequestException("entityId is required");
    }

    return this.prisma.auditLog.findMany({
      where: {
        entityType: entityType.trim(),
        entityId: entityId.trim(),
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  private computeHash(data: {
    action: string;
    entityType: string;
    entityId: string;
    userId: string;
    previousHash: string;
    timestamp: string;
  }): string {
    const payload = JSON.stringify(data);
    return crypto.createHash("sha256").update(payload).digest("hex");
  }

  async log(data: {
    userId: string;
    action: string;
    entityType: string;
    entityId: string;
    oldValue?: any;
    newValue?: any;
    ipAddress?: string;
    userAgent?: string;
  }) {
    // Get the most recent audit log entry for hash chaining
    const lastEntry = await this.prisma.auditLog.findFirst({
      orderBy: { createdAt: "desc" },
      select: { newValue: true },
    });
    const previousHash = (lastEntry?.newValue as any)?._auditHash || "GENESIS";

    const timestamp = new Date().toISOString();
    const hash = this.computeHash({
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      userId: data.userId,
      previousHash,
      timestamp,
    });

    // Merge hash into newValue
    const newValue = {
      ...(data.newValue || {}),
      _auditHash: hash,
      _previousHash: previousHash,
      _hashTimestamp: timestamp,
    };

    return this.prisma.auditLog.create({
      data: {
        ...data,
        newValue,
      },
    });
  }

  async verifyChain(limit = 1000) {
    const logs = await this.prisma.auditLog.findMany({
      orderBy: { createdAt: "asc" },
      take: limit,
      select: {
        id: true,
        action: true,
        entityType: true,
        entityId: true,
        userId: true,
        newValue: true,
        createdAt: true,
      },
    });

    let valid = true;
    let lastHash = "GENESIS";
    const errors: { logId: string; expected: string; actual: string }[] = [];

    for (const log of logs) {
      const nv = log.newValue as any;
      if (!nv?._auditHash) continue; // Skip legacy entries without hash

      const expectedPrev = nv._previousHash;
      if (expectedPrev !== lastHash) {
        valid = false;
        errors.push({
          logId: log.id,
          expected: lastHash,
          actual: expectedPrev,
        });
      }

      lastHash = nv._auditHash;
    }

    return {
      valid,
      totalChecked: logs.length,
      errors,
    };
  }
}
