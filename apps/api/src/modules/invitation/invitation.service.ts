import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import * as crypto from "crypto";
import { PrismaService } from "../../common/prisma/prisma.service";

const USER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
} as const;

function generateCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

@Injectable()
export class InvitationService {
  constructor(private prisma: PrismaService) {}

  async create(
    teamId: string,
    inviterId: string,
    data: {
      type: "EMAIL" | "LINK" | "CODE";
      email?: string;
      role?: any;
      maxUses?: number;
      expiresInDays?: number;
    },
  ) {
    const token = crypto.randomBytes(32).toString("hex");
    const code = data.type === "CODE" ? generateCode() : undefined;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (data.expiresInDays ?? 7));

    if (data.type === "EMAIL" && !data.email) {
      throw new BadRequestException(
        "Email is required for EMAIL type invitation",
      );
    }

    return this.prisma.teamInvitation.create({
      data: {
        teamId,
        inviterId,
        type: data.type ?? "EMAIL",
        email: data.email,
        token,
        code,
        role: data.role ?? "MEMBER",
        maxUses: data.maxUses,
        expiresAt,
      },
      include: {
        inviter: { select: USER_SELECT },
      },
    });
  }

  async findByTeam(teamId: string) {
    return this.prisma.teamInvitation.findMany({
      where: { teamId },
      include: { inviter: { select: USER_SELECT } },
      orderBy: { createdAt: "desc" },
    });
  }

  async revoke(teamId: string, id: string) {
    const invitation = await this.prisma.teamInvitation.findFirst({
      where: { id, teamId },
    });
    if (!invitation) throw new NotFoundException("Invitation not found");
    return this.prisma.teamInvitation.update({
      where: { id },
      data: { status: "REVOKED" },
    });
  }

  async accept(userId: string, input: { token?: string; code?: string }) {
    if (!input.token && !input.code) {
      throw new BadRequestException("token or code is required");
    }

    const invitation = await this.prisma.teamInvitation.findFirst({
      where: input.token ? { token: input.token } : { code: input.code },
    });

    if (!invitation) throw new NotFoundException("Invitation not found");
    if (invitation.status !== "PENDING") {
      throw new BadRequestException(
        `Invitation is ${invitation.status.toLowerCase()}`,
      );
    }
    if (invitation.expiresAt < new Date()) {
      await this.prisma.teamInvitation.update({
        where: { id: invitation.id },
        data: { status: "EXPIRED" },
      });
      throw new BadRequestException("Invitation has expired");
    }
    if (invitation.maxUses && invitation.usedCount >= invitation.maxUses) {
      throw new BadRequestException("Invitation has reached maximum uses");
    }

    // Check if already a member
    const existing = await this.prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId: invitation.teamId, userId } },
    });
    if (existing) {
      throw new BadRequestException("Already a member of this team");
    }

    // Add member and increment usedCount atomically
    const [member] = await this.prisma.$transaction([
      this.prisma.teamMember.create({
        data: { teamId: invitation.teamId, userId, role: invitation.role },
        include: {
          team: { select: { id: true, name: true } },
          user: { select: USER_SELECT },
        },
      }),
      this.prisma.teamInvitation.update({
        where: { id: invitation.id },
        data: {
          usedCount: { increment: 1 },
          // Mark ACCEPTED only for single-use EMAIL/CODE invitations
          status:
            invitation.type === "EMAIL" ||
            (invitation.maxUses &&
              invitation.usedCount + 1 >= invitation.maxUses)
              ? "ACCEPTED"
              : "PENDING",
        },
      }),
    ]);

    return member;
  }
}
