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
  ParseIntPipe,
  DefaultValuePipe,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { ExperimentService } from "./experiment.service";
import { CreateExperimentDto } from "./dto/create-experiment.dto";
import { UpdateExperimentDto } from "./dto/update-experiment.dto";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { PermissionGuard } from "../../common/guards/permission.guard";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";

@ApiTags("Experiments")
@ApiBearerAuth()
@UseGuards(AuthGuard("jwt"), PermissionGuard)
@Controller("experiments")
export class ExperimentController {
  constructor(private experimentService: ExperimentService) {}

  @Post()
  @RequirePermission("experiment:write")
  @ApiOperation({ summary: "Create a new experiment" })
  async create(
    @Body() dto: CreateExperimentDto,
    @CurrentUser("id") userId: string,
  ) {
    return this.experimentService.create(dto, userId);
  }

  @Get("project/:projectId")
  @ApiOperation({ summary: "List experiments by project" })
  async findByProject(
    @Param("projectId") projectId: string,
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("limit", new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.experimentService.findByProject(
      projectId,
      page,
      Math.min(limit, 100),
    );
  }

  @Get(":id/history")
  @ApiOperation({ summary: "Get experiment version history" })
  async getHistory(@Param("id") id: string) {
    return this.experimentService.getHistory(id);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get experiment details" })
  async findById(@Param("id") id: string) {
    return this.experimentService.findById(id);
  }

  @Patch(":id")
  @RequirePermission("experiment:write")
  @ApiOperation({ summary: "Update experiment" })
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateExperimentDto,
    @CurrentUser("id") userId: string,
  ) {
    return this.experimentService.update(id, dto, userId);
  }

  @Post(":id/sign")
  @RequirePermission("experiment:write")
  @ApiOperation({ summary: "Sign experiment (immutable after signing)" })
  async sign(@Param("id") id: string, @CurrentUser("id") userId: string) {
    return this.experimentService.sign(id, userId);
  }

  @Delete(":id")
  @RequirePermission("experiment:write")
  @ApiOperation({ summary: "Delete experiment" })
  async delete(@Param("id") id: string, @CurrentUser("id") userId: string) {
    return this.experimentService.delete(id, userId);
  }
}
