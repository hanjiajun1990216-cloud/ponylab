import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";

@Injectable()
export class InstrumentService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    name: string;
    manufacturer?: string;
    model?: string;
    serialNumber?: string;
    location?: string;
  }) {
    return this.prisma.instrument.create({ data });
  }

  async findAll(page = 1, limit = 20) {
    const [data, total] = await Promise.all([
      this.prisma.instrument.findMany({
        skip: (page - 1) * limit,
        take: limit,
        include: { _count: { select: { bookings: true } } },
        orderBy: { name: "asc" },
      }),
      this.prisma.instrument.count(),
    ]);
    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string) {
    const instrument = await this.prisma.instrument.findUnique({
      where: { id },
      include: {
        bookings: {
          where: { startTime: { gte: new Date() } },
          include: {
            user: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: { startTime: "asc" },
          take: 20,
        },
        maintenance: { orderBy: { performedAt: "desc" }, take: 10 },
      },
    });
    if (!instrument) throw new NotFoundException("Instrument not found");
    return instrument;
  }

  async createBooking(data: {
    instrumentId: string;
    userId: string;
    title: string;
    startTime: string;
    endTime: string;
    notes?: string;
  }) {
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);

    // Conflict detection (fix from old lab-manager repo)
    const conflict = await this.prisma.booking.findFirst({
      where: {
        instrumentId: data.instrumentId,
        status: "CONFIRMED",
        OR: [{ startTime: { lt: end }, endTime: { gt: start } }],
      },
    });

    if (conflict) {
      throw new ConflictException("Time slot conflicts with existing booking");
    }

    const instrument = await this.prisma.instrument.findUnique({
      where: { id: data.instrumentId },
    });
    if (!instrument) throw new NotFoundException("Instrument not found");

    const bookingStatus = instrument.requiresApproval ? "PENDING" : "CONFIRMED";

    return this.prisma.booking.create({
      data: {
        instrumentId: data.instrumentId,
        userId: data.userId,
        title: data.title,
        startTime: start,
        endTime: end,
        notes: data.notes,
        status: bookingStatus as any,
      },
    });
  }

  async approveBooking(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) throw new NotFoundException("Booking not found");
    if (booking.status !== "PENDING") {
      throw new BadRequestException("Only PENDING bookings can be approved");
    }
    return this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: "CONFIRMED" },
      include: {
        instrument: { select: { id: true, name: true } },
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async rejectBooking(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) throw new NotFoundException("Booking not found");
    if (booking.status !== "PENDING") {
      throw new BadRequestException("Only PENDING bookings can be rejected");
    }
    return this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: "CANCELLED" },
      include: {
        instrument: { select: { id: true, name: true } },
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async cancelBooking(instrumentId: string, bookingId: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { instrument: { select: { id: true, name: true } } },
    });

    if (!booking) throw new NotFoundException("Booking not found");
    if (booking.instrumentId !== instrumentId) {
      throw new BadRequestException("Booking does not belong to this instrument");
    }
    if (booking.status === "CANCELLED") {
      throw new BadRequestException("Booking is already cancelled");
    }

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: "CANCELLED" },
      include: {
        instrument: { select: { id: true, name: true } },
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: "CANCEL",
        entityType: "Booking",
        entityId: bookingId,
        oldValue: { status: booking.status },
        newValue: { status: "CANCELLED", instrumentName: booking.instrument.name },
      },
    });

    return updated;
  }

  async addMaintenance(
    instrumentId: string,
    data: {
      type: string;
      description: string;
      performedAt: string;
      nextDueDate?: string;
      cost?: number;
    },
  ) {
    return this.prisma.maintenanceRecord.create({
      data: {
        instrumentId,
        type: data.type,
        description: data.description,
        performedAt: new Date(data.performedAt),
        nextDueDate: data.nextDueDate ? new Date(data.nextDueDate) : undefined,
        cost: data.cost,
      },
    });
  }

  async getCalendar(instrumentId: string, start: string, end: string) {
    const instrument = await this.prisma.instrument.findUnique({
      where: { id: instrumentId },
    });
    if (!instrument) throw new NotFoundException("Instrument not found");

    const bookings = await this.prisma.booking.findMany({
      where: {
        instrumentId,
        startTime: { gte: new Date(start) },
        endTime: { lte: new Date(end) },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            userColor: true,
          },
        },
      },
      orderBy: { startTime: "asc" },
    });

    return bookings.map((b: any) => ({
      id: b.id,
      title: b.title,
      start: b.startTime,
      end: b.endTime,
      status: b.status,
      notes: b.notes,
      user: b.user,
      color: b.user.userColor,
    }));
  }

  async getStats(instrumentId: string) {
    const instrument = await this.prisma.instrument.findUnique({
      where: { id: instrumentId },
    });
    if (!instrument) throw new NotFoundException("Instrument not found");

    // Get booking stats for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const bookings = await this.prisma.booking.findMany({
      where: {
        instrumentId,
        startTime: { gte: thirtyDaysAgo },
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { startTime: "asc" },
    });

    // Daily booking counts (last 30 days)
    const dailyCounts: Record<string, number> = {};
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - 29 + i);
      dailyCounts[d.toISOString().split("T")[0]] = 0;
    }
    bookings.forEach((b: any) => {
      const day = new Date(b.startTime).toISOString().split("T")[0];
      if (dailyCounts[day] !== undefined) dailyCounts[day]++;
    });

    // User usage breakdown
    const userUsage: Record<
      string,
      { name: string; count: number; hours: number }
    > = {};
    bookings.forEach((b: any) => {
      const uid = b.user.id;
      if (!userUsage[uid]) {
        userUsage[uid] = {
          name: `${b.user.firstName} ${b.user.lastName}`,
          count: 0,
          hours: 0,
        };
      }
      userUsage[uid].count++;
      userUsage[uid].hours +=
        (new Date(b.endTime).getTime() - new Date(b.startTime).getTime()) /
        3600000;
    });

    const totalHours = Object.values(userUsage).reduce(
      (sum, u) => sum + u.hours,
      0,
    );

    return {
      totalBookings: bookings.length,
      totalHours: Math.round(totalHours * 10) / 10,
      dailyCounts: Object.entries(dailyCounts).map(([date, count]) => ({
        date,
        count,
      })),
      userUsage: Object.values(userUsage).sort((a, b) => b.hours - a.hours),
    };
  }

  async getTodayBookings(start: string, end: string) {
    return this.prisma.booking.findMany({
      where: {
        startTime: { gte: new Date(start) },
        endTime: { lte: new Date(end) },
      },
      include: {
        instrument: { select: { id: true, name: true } },
        user: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { startTime: "asc" },
      take: 10,
    });
  }

  async getAllBookings(start: string, end: string) {
    return this.prisma.booking.findMany({
      where: {
        startTime: { gte: new Date(start) },
        endTime: { lte: new Date(end) },
      },
      include: {
        instrument: { select: { id: true, name: true } },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            userColor: true,
          },
        },
      },
      orderBy: { startTime: "asc" },
    });
  }

  async checkAvailability(
    instrumentId: string,
    startTime: string,
    endTime: string,
    excludeBookingId?: string,
  ) {
    const start = new Date(startTime);
    const end = new Date(endTime);

    const conflict = await this.prisma.booking.findFirst({
      where: {
        instrumentId,
        status: "CONFIRMED",
        id: excludeBookingId ? { not: excludeBookingId } : undefined,
        OR: [{ startTime: { lt: end }, endTime: { gt: start } }],
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return {
      available: !conflict,
      conflict: conflict
        ? {
            id: conflict.id,
            title: conflict.title,
            startTime: conflict.startTime,
            endTime: conflict.endTime,
            user: conflict.user,
          }
        : null,
    };
  }
}
