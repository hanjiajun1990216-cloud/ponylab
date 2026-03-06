import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { createAIClient } from "@ponylab/ai";

@Injectable()
export class AIService {
  private ai = createAIClient();

  constructor(private prisma: PrismaService) {}

  async chat(experimentId: string, message: string, userId: string) {
    // Load experiment context
    const experiment = await this.prisma.experiment.findUnique({
      where: { id: experimentId },
      include: {
        tasks: { take: 10 },
        results: { take: 10 },
        author: { select: { firstName: true, lastName: true } },
      },
    });

    if (!experiment) throw new NotFoundException("Experiment not found");

    const context = `You are a lab assistant AI for PonyLab ELN system.
Current experiment: "${experiment.title}"
Author: ${experiment.author.firstName} ${experiment.author.lastName}
Status: ${experiment.status}
Content summary: ${typeof experiment.content === "string" ? experiment.content.substring(0, 2000) : JSON.stringify(experiment.content).substring(0, 2000)}
Tasks: ${experiment.tasks.map((t: any) => `- ${t.title} (${t.status})`).join("\n")}
Results: ${experiment.results.map((r: any) => `- Type: ${r.type}, Value: ${JSON.stringify(r.data).substring(0, 200)}`).join("\n")}

Answer the user's question in the context of this experiment. Be helpful, scientific, and concise.`;

    const response = await this.ai.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: context,
      messages: [{ role: "user", content: message }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    return { response: text };
  }

  async parseProtocol(text: string) {
    const response = await this.ai.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system:
        "You are a protocol parser. Extract structured steps from the given protocol text. Return a JSON array of steps, each with: { stepIndex: number, title: string, description: string, duration?: string, materials?: string[] }. Return ONLY valid JSON, no markdown.",
      messages: [
        {
          role: "user",
          content: `Parse this protocol into structured steps:\n\n${text}`,
        },
      ],
    });

    const rawText =
      response.content[0].type === "text" ? response.content[0].text : "[]";
    try {
      return { steps: JSON.parse(rawText) };
    } catch {
      return { steps: [], rawText };
    }
  }

  async detectAnomalies(experimentId: string) {
    const results = await this.prisma.result.findMany({
      where: { experimentId },
      orderBy: { createdAt: "asc" },
    });

    if (results.length === 0)
      return { anomalies: [], message: "No results to analyze" };

    const response = await this.ai.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system:
        'You are a data analyst. Analyze the experimental results for anomalies (outliers, unexpected trends, inconsistencies). Return a JSON object: { anomalies: [{ resultIndex: number, type: string, description: string, severity: "low"|"medium"|"high" }], summary: string }. Return ONLY valid JSON.',
      messages: [
        {
          role: "user",
          content: `Experimental results:\n${JSON.stringify(results.map((r: any) => ({ type: r.type, value: r.data, createdAt: r.createdAt })))}`,
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "{}";
    try {
      return JSON.parse(text);
    } catch {
      return { anomalies: [], summary: text };
    }
  }

  async forecastInventory(itemId: string) {
    const logs = await this.prisma.inventoryLog.findMany({
      where: { itemId },
      orderBy: { createdAt: "asc" },
      take: 100,
    });

    const item = await this.prisma.inventoryItem.findUnique({
      where: { id: itemId },
    });
    if (!item) throw new NotFoundException("Item not found");

    const response = await this.ai.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system:
        "You are an inventory analyst. Based on historical consumption data, predict when the item will run out and suggest reorder timing. Return JSON: { daysUntilEmpty: number, suggestedReorderDate: string, avgDailyConsumption: number, recommendation: string }. Return ONLY valid JSON.",
      messages: [
        {
          role: "user",
          content: `Item: ${item.name}, Current: ${item.quantity} ${item.unit}, Min: ${item.minQuantity}\nTransaction history:\n${JSON.stringify(logs.map((l: any) => ({ action: l.action, before: l.quantityBefore, after: l.quantityAfter, date: l.createdAt })))}`,
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "{}";
    try {
      return JSON.parse(text);
    } catch {
      return { recommendation: text };
    }
  }
}
