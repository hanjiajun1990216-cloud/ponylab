import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
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
}
