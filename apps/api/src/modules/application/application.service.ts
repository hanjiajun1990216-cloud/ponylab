import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";

const USER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  avatar: true,
} as const;

@Injectable()
export class ApplicationService {
  constructor(private prisma: PrismaService) {}

  async create(teamId: string, userId: string, reason?: string) {
    // Check if team exists
    const team = await this.prisma.team.findUnique({ where: { id: teamId } });
    if (!team) throw new NotFoundException("Team not found");

    // Check if already a member
    const isMember = await this.prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId } },
    });
    if (isMember) throw new ConflictException("Already a member of this team");

    // Check if pending application already exists
    const existing = await this.prisma.teamApplication.findUnique({
      where: { teamId_userId: { teamId, userId } },
    });
    if (existing) {
      if (existing.status === "PENDING") {
        throw new ConflictException("An application is already pending");
      }
      // Update rejected application to re-apply
      return this.prisma.teamApplication.update({
        where: { id: existing.id },
        data: { status: "PENDING", reason, reviewerId: null, reviewNote: null, reviewedAt: null },
        include: { user: { select: USER_SELECT } },
      });
    }

    return this.prisma.teamApplication.create({
      data: { teamId, userId, reason },
      include: { user: { select: USER_SELECT } },
    });
  }

  async findByTeam(teamId: string, status?: string) {
    return this.prisma.teamApplication.findMany({
      where: {
        teamId,
        status: status ? (status as any) : "PENDING",
      },
      include: {
        user: { select: USER_SELECT },
        reviewer: { select: USER_SELECT },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  async review(
    teamId: string,
    id: string,
    reviewerId: string,
    action: "approve" | "reject",
    reviewNote?: string,
  ) {
    const application = await this.prisma.teamApplication.findFirst({
      where: { id, teamId },
    });
    if (!application) throw new NotFoundException("Application not found");
    if (application.status !== "PENDING") {
      throw new BadRequestException("Application is no longer pending");
    }

    const status = action === "approve" ? "APPROVED" : "REJECTED";

    if (action === "approve") {
      const [updated] = await this.prisma.$transaction([
        this.prisma.teamApplication.update({
          where: { id },
          data: {
            status,
            reviewerId,
            reviewNote,
            reviewedAt: new Date(),
          },
          include: { user: { select: USER_SELECT } },
        }),
        this.prisma.teamMember.create({
          data: { teamId, userId: application.userId, role: "MEMBER" },
        }),
      ]);
      return updated;
    }

    return this.prisma.teamApplication.update({
      where: { id },
      data: {
        status,
        reviewerId,
        reviewNote,
        reviewedAt: new Date(),
      },
      include: { user: { select: USER_SELECT } },
    });
  }
}
