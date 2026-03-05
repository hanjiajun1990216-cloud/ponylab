import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { DirectionService } from "./direction.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@ApiTags("Directions")
@ApiBearerAuth()
@UseGuards(AuthGuard("jwt"))
@Controller("directions")
export class DirectionController {
  constructor(private directionService: DirectionService) {}

  @Post()
  @ApiOperation({ summary: "Create a research direction" })
  async create(
    @Body()
    body: {
      teamId: string;
      name: string;
      description?: string;
      color?: string;
    },
    @CurrentUser("id") userId: string,
  ) {
    return this.directionService.create({ ...body, leadId: userId });
  }

  @Get()
  @ApiOperation({ summary: "List directions by team" })
  async findByTeam(@Query("teamId") teamId: string) {
    return this.directionService.findByTeam(teamId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get direction with projects and lead" })
  async findById(@Param("id") id: string) {
    return this.directionService.findById(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update direction" })
  async update(
    @Param("id") id: string,
    @Body()
    body: {
      name?: string;
      description?: string;
      leadId?: string;
      status?: string;
      color?: string;
      sortOrder?: number;
    },
  ) {
    return this.directionService.update(id, body);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete direction" })
  async delete(@Param("id") id: string) {
    return this.directionService.delete(id);
  }
}
