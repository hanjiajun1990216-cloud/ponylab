import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { InstrumentService } from "./instrument.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { PermissionGuard } from "../../common/guards/permission.guard";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";

@ApiTags("Instruments")
@ApiBearerAuth()
@UseGuards(AuthGuard("jwt"), PermissionGuard)
@Controller("instruments")
export class InstrumentController {
  constructor(private instrumentService: InstrumentService) {}

  @Post()
  @RequirePermission("instrument:admin")
  @ApiOperation({ summary: "Register a new instrument" })
  async create(@Body() body: any) {
    return this.instrumentService.create(body);
  }

  @Get()
  @ApiOperation({ summary: "List instruments" })
  async findAll(
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("limit", new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.instrumentService.findAll(page, Math.min(limit, 100));
  }

  @Get("bookings/today")
  @ApiOperation({ summary: "Get today bookings across all instruments" })
  async getTodayBookings(
    @Query("start") start: string,
    @Query("end") end: string,
  ) {
    return this.instrumentService.getTodayBookings(start, end);
  }

  @Get("all-bookings")
  @ApiOperation({ summary: "Get all instrument bookings for timeline" })
  async getAllBookings(
    @Query("start") start: string,
    @Query("end") end: string,
  ) {
    return this.instrumentService.getAllBookings(start, end);
  }

  @Post("bookings/:bookingId/approve")
  @RequirePermission("instrument:admin")
  @ApiOperation({ summary: "Approve a pending booking" })
  async approveBooking(@Param("bookingId") bookingId: string) {
    return this.instrumentService.approveBooking(bookingId);
  }

  @Post("bookings/:bookingId/reject")
  @RequirePermission("instrument:admin")
  @ApiOperation({ summary: "Reject a pending booking" })
  async rejectBooking(@Param("bookingId") bookingId: string) {
    return this.instrumentService.rejectBooking(bookingId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get instrument with bookings and maintenance" })
  async findById(@Param("id") id: string) {
    return this.instrumentService.findById(id);
  }

  @Post(":id/bookings")
  @RequirePermission("instrument:admin")
  @ApiOperation({ summary: "Book instrument (with conflict detection)" })
  async createBooking(
    @Param("id") instrumentId: string,
    @Body()
    body: { title: string; startTime: string; endTime: string; notes?: string },
    @CurrentUser("id") userId: string,
  ) {
    return this.instrumentService.createBooking({
      ...body,
      instrumentId,
      userId,
    });
  }

  @Delete(":id/bookings/:bookingId")
  @RequirePermission("instrument:admin")
  @ApiOperation({ summary: "Cancel a booking" })
  async cancelBooking(
    @Param("id") instrumentId: string,
    @Param("bookingId") bookingId: string,
    @CurrentUser("id") userId: string,
  ) {
    return this.instrumentService.cancelBooking(
      instrumentId,
      bookingId,
      userId,
    );
  }

  @Post(":id/maintenance")
  @RequirePermission("instrument:admin")
  @ApiOperation({ summary: "Add maintenance record" })
  async addMaintenance(
    @Param("id") instrumentId: string,
    @Body()
    body: {
      type: string;
      description: string;
      performedAt: string;
      nextDueDate?: string;
      cost?: number;
    },
  ) {
    return this.instrumentService.addMaintenance(instrumentId, body);
  }

  @Get(":id/stats")
  @ApiOperation({ summary: "Get instrument usage statistics" })
  async getStats(@Param("id") id: string) {
    return this.instrumentService.getStats(id);
  }

  @Get(":id/calendar")
  @ApiOperation({ summary: "Get instrument calendar data with bookings" })
  async getCalendar(
    @Param("id") id: string,
    @Query("start") start: string,
    @Query("end") end: string,
  ) {
    return this.instrumentService.getCalendar(id, start, end);
  }

  @Post(":id/check-availability")
  @ApiOperation({ summary: "Check instrument availability for a time slot" })
  async checkAvailability(
    @Param("id") id: string,
    @Body()
    body: {
      startTime: string;
      endTime: string;
      excludeBookingId?: string;
    },
  ) {
    return this.instrumentService.checkAvailability(
      id,
      body.startTime,
      body.endTime,
      body.excludeBookingId,
    );
  }
}
