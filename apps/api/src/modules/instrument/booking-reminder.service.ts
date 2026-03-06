import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "../../common/prisma/prisma.service";
import { NotificationService } from "../notification/notification.service";

@Injectable()
export class BookingReminderService {
  private readonly logger = new Logger(BookingReminderService.name);

  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async sendBookingReminders() {
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Find bookings starting within the next 24 hours that haven't been reminded
    const upcomingBookings = await this.prisma.booking.findMany({
      where: {
        startTime: { gte: now, lte: in24h },
        status: "CONFIRMED",
        reminderSent: false,
      },
      include: {
        instrument: { select: { id: true, name: true } },
        user: { select: { id: true, firstName: true } },
      },
    });

    for (const booking of upcomingBookings) {
      try {
        await this.notificationService.create({
          userId: booking.userId,
          type: "BOOKING_REMINDER",
          title: "Upcoming Instrument Booking",
          message: `Your booking for ${booking.instrument.name} starts at ${booking.startTime.toLocaleString()}`,
          link: `/instruments/${booking.instrumentId}`,
        });

        await this.prisma.booking.update({
          where: { id: booking.id },
          data: { reminderSent: true },
        });

        this.logger.log(`Reminder sent for booking ${booking.id}`);
      } catch (error) {
        this.logger.error(
          `Failed to send reminder for booking ${booking.id}`,
          error,
        );
      }
    }

    if (upcomingBookings.length > 0) {
      this.logger.log(`Sent ${upcomingBookings.length} booking reminders`);
    }
  }
}
