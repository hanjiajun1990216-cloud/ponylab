import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from "@nestjs/swagger";
import { ExperimentTemplateService } from "./experiment-template.service";
import { CreateExperimentTemplateDto } from "./dto/create-template.dto";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { PermissionGuard } from "../../common/guards/permission.guard";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";

@ApiTags("Experiment Templates")
@ApiBearerAuth()
@UseGuards(AuthGuard("jwt"), PermissionGuard)
@Controller("experiment-templates")
export class ExperimentTemplateController {
  constructor(
    private readonly experimentTemplateService: ExperimentTemplateService,
  ) {}

  @Get()
  @ApiOperation({ summary: "获取实验模板列表" })
  @ApiQuery({ name: "teamId", required: false, description: "团队 ID 过滤" })
  @ApiQuery({
    name: "isPublic",
    required: false,
    description: "是否仅显示公开模板",
  })
  findAll(
    @Query("teamId") teamId?: string,
    @Query("isPublic") isPublic?: string,
  ) {
    const isPublicBool =
      isPublic === undefined ? undefined : isPublic === "true";
    return this.experimentTemplateService.findAll(teamId, isPublicBool);
  }

  @Get(":id")
  @ApiOperation({ summary: "获取实验模板详情" })
  findById(@Param("id") id: string) {
    return this.experimentTemplateService.findById(id);
  }

  @Post()
  @RequirePermission("experiment:write")
  @ApiOperation({ summary: "创建实验模板" })
  create(
    @Body() dto: CreateExperimentTemplateDto,
    @CurrentUser("id") userId: string,
  ) {
    return this.experimentTemplateService.create(dto, userId);
  }

  @Delete(":id")
  @ApiOperation({ summary: "删除实验模板（仅作者可删）" })
  delete(@Param("id") id: string, @CurrentUser("id") userId: string) {
    return this.experimentTemplateService.delete(id, userId);
  }
}
