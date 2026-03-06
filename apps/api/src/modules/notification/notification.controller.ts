import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { NotificationService } from "./notification.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@ApiTags("Notifications")
@ApiBearerAuth()
@UseGuards(AuthGuard("jwt"))
@Controller("notifications")
export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  @Get()
  @ApiOperation({
    summary: "Get notifications for current user (unread first)",
  })
  async findByUser(
    @CurrentUser("id") userId: string,
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("limit", new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.notificationService.findByUser(
      userId,
      page,
      Math.min(limit, 100),
    );
  }

  @Get("unread-count")
  @ApiOperation({ summary: "Get unread notification count" })
  async getUnreadCount(@CurrentUser("id") userId: string) {
    return this.notificationService.getUnreadCount(userId);
  }

  @Get("preferences")
  @ApiOperation({ summary: "Get notification preferences" })
  async getPreferences(@CurrentUser("id") userId: string) {
    return this.notificationService.getPreferences(userId);
  }

  @Patch("preferences/:type")
  @ApiOperation({ summary: "Update notification preference" })
  async updatePreference(
    @CurrentUser("id") userId: string,
    @Param("type") type: string,
    @Body() body: { email?: boolean; inApp?: boolean },
  ) {
    return this.notificationService.updatePreference(userId, type, body);
  }

  @Patch(":id/read")
  @ApiOperation({ summary: "Mark a notification as read" })
  async markRead(@Param("id") id: string, @CurrentUser("id") userId: string) {
    return this.notificationService.markRead(id, userId);
  }

  @Patch("read-all")
  @ApiOperation({ summary: "Mark all notifications as read" })
  async markAllRead(@CurrentUser("id") userId: string) {
    return this.notificationService.markAllRead(userId);
  }
}
