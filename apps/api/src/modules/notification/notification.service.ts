import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  /** Called by other services to create a notification */
  async create(data: {
    userId: string;
    type: string;
    title: string;
    message: string;
    link?: string;
    metadata?: any;
  }) {
    return this.prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        link: data.link,
        metadata: data.metadata,
      },
    });
  }

  async findByUser(userId: string, page = 1, limit = 20) {
    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: [{ isRead: "asc" }, { createdAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.notification.count({ where: { userId } }),
    ]);
    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async markRead(id: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });
    if (!notification) throw new NotFoundException("Notification not found");
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { updated: result.count };
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { count };
  }

  async getPreferences(userId: string) {
    const prefs = await this.prisma.notificationPreference.findMany({
      where: { userId },
    });
    // Return default preferences for types that don't exist yet
    const defaultTypes = [
      "TASK_ASSIGNED",
      "TASK_DUE",
      "BOOKING_CONFIRMED",
      "TEAM_MESSAGE",
      "LOW_STOCK",
      "EXPERIMENT_STATUS",
      "BOOKING_REMINDER",
    ];
    const prefMap = new Map(prefs.map((p: any) => [p.type, p]));
    return defaultTypes.map((type) => ({
      type,
      email: (prefMap.get(type) as any)?.email ?? true,
      inApp: (prefMap.get(type) as any)?.inApp ?? true,
    }));
  }

  async updatePreference(
    userId: string,
    type: string,
    data: { email?: boolean; inApp?: boolean },
  ) {
    return this.prisma.notificationPreference.upsert({
      where: { userId_type: { userId, type } },
      update: { email: data.email, inApp: data.inApp },
      create: {
        userId,
        type,
        email: data.email ?? true,
        inApp: data.inApp ?? true,
      },
    });
  }
}
