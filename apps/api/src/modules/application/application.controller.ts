import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { ApplicationService } from "./application.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@ApiTags("Applications")
@ApiBearerAuth()
@UseGuards(AuthGuard("jwt"))
@Controller("teams/:teamId/applications")
export class ApplicationController {
  constructor(private applicationService: ApplicationService) {}

  @Post()
  @ApiOperation({ summary: "Submit a join request" })
  async create(
    @Param("teamId") teamId: string,
    @Body() body: { reason?: string },
    @CurrentUser("id") userId: string,
  ) {
    return this.applicationService.create(teamId, userId, body.reason);
  }

  @Get()
  @ApiOperation({ summary: "List team applications (pending by default)" })
  async findByTeam(
    @Param("teamId") teamId: string,
    @Query("status") status?: string,
  ) {
    return this.applicationService.findByTeam(teamId, status);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Approve or reject an application" })
  async review(
    @Param("teamId") teamId: string,
    @Param("id") id: string,
    @Body() body: { action: "approve" | "reject"; reviewNote?: string },
    @CurrentUser("id") reviewerId: string,
  ) {
    return this.applicationService.review(
      teamId,
      id,
      reviewerId,
      body.action,
      body.reviewNote,
    );
  }
}
