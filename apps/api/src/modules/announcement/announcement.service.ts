import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";

const AUTHOR_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  avatar: true,
} as const;

@Injectable()
export class AnnouncementService {
  constructor(private prisma: PrismaService) {}

  async findMany(filter: {
    scope?: string;
    teamId?: string;
    instrumentId?: string;
  }) {
    return this.prisma.announcement.findMany({
      where: {
        scope: filter.scope ? (filter.scope as any) : undefined,
        teamId: filter.teamId,
        instrumentId: filter.instrumentId,
      },
      include: {
        author: { select: AUTHOR_SELECT },
        team: { select: { id: true, name: true } },
        instrument: { select: { id: true, name: true } },
      },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    });
  }

  async create(
    authorId: string,
    data: {
      scope: "INSTRUMENT" | "INVENTORY" | "TEAM";
      title: string;
      content: string;
      isPinned?: boolean;
      expiresAt?: string;
      teamId?: string;
      instrumentId?: string;
    },
  ) {
    if (data.scope === "TEAM" && !data.teamId) {
      throw new BadRequestException("teamId is required for TEAM scope");
    }
    if (data.scope === "INSTRUMENT" && !data.instrumentId) {
      throw new BadRequestException(
        "instrumentId is required for INSTRUMENT scope",
      );
    }

    return this.prisma.announcement.create({
      data: {
        scope: data.scope,
        authorId,
        title: data.title,
        content: data.content,
        isPinned: data.isPinned ?? false,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
        teamId: data.teamId,
        instrumentId: data.instrumentId,
      },
      include: {
        author: { select: AUTHOR_SELECT },
      },
    });
  }

  async update(
    id: string,
    data: {
      title?: string;
      content?: string;
      isPinned?: boolean;
      expiresAt?: string | null;
    },
  ) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
    });
    if (!announcement) throw new NotFoundException("Announcement not found");

    return this.prisma.announcement.update({
      where: { id },
      data: {
        title: data.title,
        content: data.content,
        isPinned: data.isPinned,
        expiresAt:
          data.expiresAt === null
            ? null
            : data.expiresAt
              ? new Date(data.expiresAt)
              : undefined,
      },
      include: { author: { select: AUTHOR_SELECT } },
    });
  }

  async delete(id: string) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
    });
    if (!announcement) throw new NotFoundException("Announcement not found");
    return this.prisma.announcement.delete({ where: { id } });
  }
}
