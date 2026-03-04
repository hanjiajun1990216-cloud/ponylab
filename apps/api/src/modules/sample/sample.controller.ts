import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { SampleService } from "./sample.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@ApiTags("Samples")
@ApiBearerAuth()
@UseGuards(AuthGuard("jwt"))
@Controller("samples")
export class SampleController {
  constructor(private sampleService: SampleService) {}

  @Post()
  @ApiOperation({ summary: "Create a new sample" })
  async create(
    @Body() body: { name: string; sampleType: string; barcode?: string; metadata?: any; storageId?: string; experimentId?: string },
    @CurrentUser("id") userId: string,
  ) {
    return this.sampleService.create(body, userId);
  }

  @Get()
  @ApiOperation({ summary: "List all samples" })
  async findAll(
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("limit", new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query("sampleType") sampleType?: string,
    @Query("status") status?: string,
  ) {
    return this.sampleService.findAll(page, Math.min(limit, 100), { sampleType, status });
  }

  @Get(":id")
  @ApiOperation({ summary: "Get sample details with event history" })
  async findById(@Param("id") id: string) {
    return this.sampleService.findById(id);
  }

  @Post(":id/events")
  @ApiOperation({ summary: "Add event to sample" })
  async addEvent(
    @Param("id") id: string,
    @Body() body: { type: string; note?: string },
    @CurrentUser("id") userId: string,
  ) {
    return this.sampleService.addEvent(id, body.type, userId, body.note);
  }

  @Patch(":id/status")
  @ApiOperation({ summary: "Update sample status" })
  async updateStatus(
    @Param("id") id: string,
    @Body() body: { status: string },
    @CurrentUser("id") userId: string,
  ) {
    return this.sampleService.updateStatus(id, body.status, userId);
  }
}
