import { Injectable, NotFoundException } from "@nestjs/common";
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

  async exportExperimentPdf(experimentId: string): Promise<Buffer> {
    const experiment = await this.prisma.experiment.findUnique({
      where: { id: experimentId },
      include: {
        author: { select: { firstName: true, lastName: true, email: true } },
        project: { select: { name: true } },
        tasks: { orderBy: { priority: "desc" }, take: 50 },
        results: { orderBy: { createdAt: "desc" }, take: 50 },
        tags: true,
      },
    });
    if (!experiment)
      throw new NotFoundException(`Experiment ${experimentId} not found`);

    // Use dynamic import for jspdf (it's ESM)
    const { jsPDF } = await import("jspdf");
    // @ts-ignore - jspdf-autotable augments jsPDF
    await import("jspdf-autotable");

    const doc = new jsPDF();
    let y = 20;

    // Title
    doc.setFontSize(18);
    doc.text(experiment.title, 14, y);
    y += 10;

    // Metadata
    doc.setFontSize(10);
    doc.setTextColor(100);
    const authorName =
      `${experiment.author?.firstName ?? ""} ${experiment.author?.lastName ?? ""}`.trim();
    doc.text(`Author: ${authorName}`, 14, y);
    y += 5;
    doc.text(`Project: ${experiment.project?.name ?? "N/A"}`, 14, y);
    y += 5;
    doc.text(`Status: ${experiment.status}`, 14, y);
    y += 5;
    doc.text(
      `Created: ${experiment.createdAt.toISOString().split("T")[0]}`,
      14,
      y,
    );
    y += 5;
    if (experiment.signedAt) {
      doc.text(
        `Signed: ${experiment.signedAt.toISOString().split("T")[0]}`,
        14,
        y,
      );
      y += 5;
    }
    if ((experiment as any).tags?.length > 0) {
      doc.text(
        `Tags: ${(experiment as any).tags.map((t: any) => t.tag).join(", ")}`,
        14,
        y,
      );
      y += 5;
    }
    y += 5;

    // Content (text extract from JSON/string)
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text("Content", 14, y);
    y += 6;
    doc.setFontSize(9);
    const contentText =
      typeof experiment.content === "string"
        ? experiment.content
        : JSON.stringify(experiment.content ?? {});
    const contentLines = doc.splitTextToSize(
      contentText.substring(0, 3000),
      180,
    );
    doc.text(contentLines, 14, y);
    y += contentLines.length * 4 + 10;

    // Tasks table
    if ((experiment as any).tasks.length > 0 && y < 250) {
      doc.setFontSize(12);
      doc.text("Tasks", 14, y);
      y += 6;
      (doc as any).autoTable({
        startY: y,
        head: [["Title", "Status", "Priority", "Due Date"]],
        body: (experiment as any).tasks.map((t: any) => [
          t.title,
          t.status,
          String(t.priority ?? ""),
          t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "N/A",
        ]),
        styles: { fontSize: 8 },
        margin: { left: 14 },
      });
      y = (doc as any).lastAutoTable.finalY + 10;
    }

    // Results table
    if ((experiment as any).results.length > 0 && y < 250) {
      doc.setFontSize(12);
      doc.text("Results", 14, y);
      y += 6;
      (doc as any).autoTable({
        startY: y,
        head: [["Type", "Title", "Value", "Date"]],
        body: (experiment as any).results.map((r: any) => [
          r.type ?? "",
          r.title ?? "",
          JSON.stringify(r.data ?? {}).substring(0, 80),
          new Date(r.createdAt).toLocaleDateString(),
        ]),
        styles: { fontSize: 8 },
        margin: { left: 14 },
      });
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`PonyLab ELN — Page ${i}/${pageCount}`, 14, 290);
      doc.text(`Generated: ${new Date().toISOString()}`, 120, 290);
    }

    return Buffer.from(doc.output("arraybuffer"));
  }

  async exportProjectPdf(projectId: string): Promise<Buffer> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        lead: { select: { firstName: true, lastName: true, email: true } },
        team: { select: { name: true } },
        experiments: {
          include: {
            author: { select: { firstName: true, lastName: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 100,
        },
        tasks: {
          orderBy: { createdAt: "desc" },
          take: 200,
        },
      },
    });
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);

    // Use dynamic import for jspdf (it's ESM)
    const { jsPDF } = await import("jspdf");
    // @ts-ignore - jspdf-autotable augments jsPDF
    await import("jspdf-autotable");

    const doc = new jsPDF();
    let y = 20;

    // Title
    doc.setFontSize(20);
    doc.text(`Project Report: ${project.name}`, 14, y);
    y += 12;

    // Project metadata
    doc.setFontSize(10);
    doc.setTextColor(100);
    const leadName =
      `${project.lead?.firstName ?? ""} ${project.lead?.lastName ?? ""}`.trim();
    doc.text(`Team: ${project.team?.name ?? "N/A"}`, 14, y);
    y += 5;
    if (leadName) {
      doc.text(`Lead: ${leadName}`, 14, y);
      y += 5;
    }
    doc.text(`Status: ${project.status}`, 14, y);
    y += 5;
    doc.text(
      `Created: ${project.createdAt.toISOString().split("T")[0]}`,
      14,
      y,
    );
    y += 5;
    if (project.startDate) {
      doc.text(
        `Start Date: ${project.startDate.toISOString().split("T")[0]}`,
        14,
        y,
      );
      y += 5;
    }
    if (project.endDate) {
      doc.text(
        `End Date: ${project.endDate.toISOString().split("T")[0]}`,
        14,
        y,
      );
      y += 5;
    }
    y += 5;

    // Description
    if (project.description) {
      doc.setFontSize(11);
      doc.setTextColor(0);
      doc.text("Description", 14, y);
      y += 6;
      doc.setFontSize(9);
      const descLines = doc.splitTextToSize(project.description, 180);
      doc.text(descLines, 14, y);
      y += descLines.length * 4 + 8;
    }

    // Task summary
    const tasks = (project as any).tasks as any[];
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(
      (t: any) => t.status === "DONE" || t.status === "COMPLETED",
    ).length;
    const inProgressTasks = tasks.filter(
      (t: any) => t.status === "IN_PROGRESS",
    ).length;

    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text("Task Summary", 14, y);
    y += 6;
    doc.setFontSize(9);
    doc.setTextColor(60);
    doc.text(`Total Tasks: ${totalTasks}`, 14, y);
    y += 5;
    doc.text(`Completed: ${completedTasks}`, 14, y);
    y += 5;
    doc.text(`In Progress: ${inProgressTasks}`, 14, y);
    y += 10;

    // Experiments table
    const experiments = (project as any).experiments as any[];
    if (experiments.length > 0) {
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text(`Experiments (${experiments.length})`, 14, y);
      y += 6;
      (doc as any).autoTable({
        startY: y,
        head: [["Title", "Status", "Author", "Created"]],
        body: experiments.map((e: any) => [
          e.title,
          e.status,
          `${e.author?.firstName ?? ""} ${e.author?.lastName ?? ""}`.trim(),
          new Date(e.createdAt).toLocaleDateString(),
        ]),
        styles: { fontSize: 8 },
        margin: { left: 14 },
        columnStyles: {
          0: { cellWidth: 70 },
          1: { cellWidth: 30 },
          2: { cellWidth: 50 },
          3: { cellWidth: 30 },
        },
      });
      y = (doc as any).lastAutoTable.finalY + 10;
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`PonyLab ELN — Page ${i}/${pageCount}`, 14, 290);
      doc.text(`Generated: ${new Date().toISOString()}`, 120, 290);
    }

    return Buffer.from(doc.output("arraybuffer"));
  }
}
