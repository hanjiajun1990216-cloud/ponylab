import {
  Controller,
  Get,
  Post,
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

@ApiTags("Instruments")
@ApiBearerAuth()
@UseGuards(AuthGuard("jwt"))
@Controller("instruments")
export class InstrumentController {
  constructor(private instrumentService: InstrumentService) {}

  @Post()
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

  @Get(":id")
  @ApiOperation({ summary: "Get instrument with bookings and maintenance" })
  async findById(@Param("id") id: string) {
    return this.instrumentService.findById(id);
  }

  @Post(":id/bookings")
  @ApiOperation({ summary: "Book instrument (with conflict detection)" })
  async createBooking(
    @Param("id") instrumentId: string,
    @Body() body: { title: string; startTime: string; endTime: string; notes?: string },
    @CurrentUser("id") userId: string,
  ) {
    return this.instrumentService.createBooking({ ...body, instrumentId, userId });
  }

  @Post(":id/maintenance")
  @ApiOperation({ summary: "Add maintenance record" })
  async addMaintenance(
    @Param("id") instrumentId: string,
    @Body() body: { type: string; description: string; performedAt: string; nextDueDate?: string; cost?: number },
  ) {
    return this.instrumentService.addMaintenance(instrumentId, body);
  }
}
