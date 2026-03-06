import { Module } from "@nestjs/common";
import { InstrumentService } from "./instrument.service";
import { InstrumentController } from "./instrument.controller";
import { BookingReminderService } from "./booking-reminder.service";
import { NotificationModule } from "../notification/notification.module";

@Module({
  imports: [NotificationModule],
  controllers: [InstrumentController],
  providers: [InstrumentService, BookingReminderService],
  exports: [InstrumentService],
})
export class InstrumentModule {}
