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
export class CommentService {
  constructor(private prisma: PrismaService) {}

  async findMany(filter: {
    projectId?: string;
    taskId?: string;
    instrumentId?: string;
  }) {
    if (!filter.projectId && !filter.taskId && !filter.instrumentId) {
      throw new BadRequestException(
        "At least one of projectId, taskId, or instrumentId is required",
      );
    }

    return this.prisma.comment.findMany({
      where: {
        projectId: filter.projectId,
        taskId: filter.taskId,
        instrumentId: filter.instrumentId,
        parentId: null, // top-level comments only
      },
      include: {
        author: { select: AUTHOR_SELECT },
        replies: {
          include: { author: { select: AUTHOR_SELECT } },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: [{ isPinned: "desc" }, { createdAt: "asc" }],
    });
  }

  async create(
    authorId: string,
    data: {
      content: string;
      projectId?: string;
      taskId?: string;
      instrumentId?: string;
      label?: string;
    },
  ) {
    if (!data.projectId && !data.taskId && !data.instrumentId) {
      throw new BadRequestException(
        "At least one of projectId, taskId, or instrumentId must be set",
      );
    }

    return this.prisma.comment.create({
      data: {
        content: data.content,
        authorId,
        projectId: data.projectId,
        taskId: data.taskId,
        instrumentId: data.instrumentId,
        label: data.label,
      },
      include: { author: { select: AUTHOR_SELECT } },
    });
  }

  async reply(parentId: string, authorId: string, content: string) {
    const parent = await this.prisma.comment.findUnique({
      where: { id: parentId },
    });
    if (!parent) throw new NotFoundException("Comment not found");
    if (parent.parentId) {
      throw new BadRequestException("Cannot reply to a reply (max 1 level)");
    }

    return this.prisma.comment.create({
      data: {
        content,
        authorId,
        parentId,
        // Copy parent's polymorphic fields
        projectId: parent.projectId,
        taskId: parent.taskId,
        instrumentId: parent.instrumentId,
      },
      include: { author: { select: AUTHOR_SELECT } },
    });
  }

  async update(
    id: string,
    data: { isPinned?: boolean; label?: string; content?: string },
  ) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment) throw new NotFoundException("Comment not found");
    return this.prisma.comment.update({
      where: { id },
      data,
      include: { author: { select: AUTHOR_SELECT } },
    });
  }

  async delete(id: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment) throw new NotFoundException("Comment not found");
    return this.prisma.comment.delete({ where: { id } });
  }
}
