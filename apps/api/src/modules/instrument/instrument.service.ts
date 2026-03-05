import { Injectable, NotFoundException, ConflictException, BadRequestException } from "@nestjs/common";
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
          include: { user: { select: { id: true, firstName: true, lastName: true } } },
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
        OR: [
          { startTime: { lt: end }, endTime: { gt: start } },
        ],
      },
    });

    if (conflict) {
      throw new ConflictException("Time slot conflicts with existing booking");
    }

    return this.prisma.booking.create({
      data: {
        instrumentId: data.instrumentId,
        userId: data.userId,
        title: data.title,
        startTime: start,
        endTime: end,
        notes: data.notes,
      },
    });
  }

  async addMaintenance(instrumentId: string, data: {
    type: string;
    description: string;
    performedAt: string;
    nextDueDate?: string;
    cost?: number;
  }) {
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

    return bookings.map((b) => ({
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
