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
import { ProtocolService } from "./protocol.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@ApiTags("Protocols")
@ApiBearerAuth()
@UseGuards(AuthGuard("jwt"))
@Controller("protocols")
export class ProtocolController {
  constructor(private protocolService: ProtocolService) {}

  @Post()
  @ApiOperation({ summary: "Create a new protocol" })
  async create(
    @Body() body: { name: string; description?: string; category?: string; content: any },
    @CurrentUser("id") userId: string,
  ) {
    return this.protocolService.create(body, userId);
  }

  @Get()
  @ApiOperation({ summary: "List protocols" })
  async findAll(
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("limit", new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query("category") category?: string,
  ) {
    return this.protocolService.findAll(page, Math.min(limit, 100), category);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get protocol with all versions" })
  async findById(@Param("id") id: string) {
    return this.protocolService.findById(id);
  }

  @Post(":id/versions")
  @ApiOperation({ summary: "Create new protocol version" })
  async createVersion(
    @Param("id") id: string,
    @Body() body: { content: any; changelog?: string },
  ) {
    return this.protocolService.createVersion(id, body.content, body.changelog);
  }

  @Post(":id/publish")
  @ApiOperation({ summary: "Publish protocol" })
  async publish(@Param("id") id: string) {
    return this.protocolService.publish(id);
  }
}
