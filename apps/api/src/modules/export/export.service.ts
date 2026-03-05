import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";

@Injectable()
export class ExportService {
  constructor(private prisma: PrismaService) {}

  async exportExperiments(projectId?: string) {
    const where: any = {};
    if (projectId) where.projectId = projectId;

    const experiments = await this.prisma.experiment.findMany({
      where,
      include: {
        author: { select: { firstName: true, lastName: true, email: true } },
        project: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return experiments.map((e: any) => ({
      id: e.id,
      title: e.title,
      status: e.status,
      project: e.project?.name ?? "",
      author: `${e.author?.firstName ?? ""} ${e.author?.lastName ?? ""}`.trim(),
      authorEmail: e.author?.email ?? "",
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
      signedAt: e.signedAt?.toISOString() ?? "",
    }));
  }

  async exportInventory(teamId?: string) {
    const where: any = {};
    if (teamId) where.teamId = teamId;

    const items = await this.prisma.inventoryItem.findMany({
      where,
      orderBy: { name: "asc" },
    });

    return items.map((i: any) => ({
      id: i.id,
      name: i.name,
      category: i.category,
      sku: i.sku ?? "",
      quantity: i.quantity,
      unit: i.unit,
      minQuantity: i.minQuantity ?? "",
      supplier: i.supplier ?? "",
      catalogNumber: i.catalogNumber ?? "",
      expiryDate: i.expiryDate?.toISOString() ?? "",
      createdAt: i.createdAt.toISOString(),
    }));
  }

  async exportSamples(projectId?: string) {
    const where: any = {};
    if (projectId) where.projectId = projectId;

    const samples = await this.prisma.sample.findMany({
      where,
      include: {
        createdBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return samples.map((s: any) => ({
      id: s.id,
      name: s.name,
      barcode: s.barcode ?? "",
      sampleType: s.sampleType ?? "",
      status: s.status,
      storagePosition: s.storagePosition ?? "",
      creator:
        `${s.createdBy?.firstName ?? ""} ${s.createdBy?.lastName ?? ""}`.trim(),
      createdAt: s.createdAt.toISOString(),
    }));
  }

  toCsv(rows: Record<string, any>[]): string {
    if (rows.length === 0) return "";
    const headers = Object.keys(rows[0]);
    const csvRows = [
      headers.join(","),
      ...rows.map((row) =>
        headers
          .map((h) => {
            const val = String(row[h] ?? "");
            // Escape commas and quotes in CSV
            if (val.includes(",") || val.includes('"') || val.includes("\n")) {
              return `"${val.replace(/"/g, '""')}"`;
            }
            return val;
          })
          .join(","),
      ),
    ];
    return csvRows.join("\n");
  }
}
