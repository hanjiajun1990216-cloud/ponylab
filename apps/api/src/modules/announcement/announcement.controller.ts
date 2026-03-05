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
import { AnnouncementService } from "./announcement.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@ApiTags("Announcements")
@ApiBearerAuth()
@UseGuards(AuthGuard("jwt"))
@Controller("announcements")
export class AnnouncementController {
  constructor(private announcementService: AnnouncementService) {}

  @Get()
  @ApiOperation({ summary: "List announcements by scope/teamId/instrumentId" })
  async findMany(
    @Query("scope") scope?: string,
    @Query("teamId") teamId?: string,
    @Query("instrumentId") instrumentId?: string,
  ) {
    return this.announcementService.findMany({ scope, teamId, instrumentId });
  }

  @Post()
  @ApiOperation({ summary: "Create an announcement" })
  async create(
    @Body()
    body: {
      scope: "INSTRUMENT" | "INVENTORY" | "TEAM";
      title: string;
      content: string;
      isPinned?: boolean;
      expiresAt?: string;
      teamId?: string;
      instrumentId?: string;
    },
    @CurrentUser("id") userId: string,
  ) {
    return this.announcementService.create(userId, body);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update announcement (pin/unpin)" })
  async update(
    @Param("id") id: string,
    @Body()
    body: {
      title?: string;
      content?: string;
      isPinned?: boolean;
      expiresAt?: string | null;
    },
  ) {
    return this.announcementService.update(id, body);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete an announcement" })
  async delete(@Param("id") id: string) {
    return this.announcementService.delete(id);
  }
}
