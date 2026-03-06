import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { WebhookService } from "./webhook.service";
import { PermissionGuard } from "../../common/guards/permission.guard";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";

@ApiTags("Webhooks")
@ApiBearerAuth()
@UseGuards(AuthGuard("jwt"), PermissionGuard)
@Controller("webhooks")
export class WebhookController {
  constructor(private webhookService: WebhookService) {}

  @Post()
  @RequirePermission("team:manage")
  @ApiOperation({ summary: "Register a webhook" })
  async register(
    @Body() body: { url: string; events: string[]; secret: string },
  ) {
    return this.webhookService.register(body);
  }

  @Get()
  @ApiOperation({ summary: "List registered webhooks" })
  async findAll() {
    return this.webhookService.findAll();
  }

  @Delete(":id")
  @RequirePermission("team:manage")
  @ApiOperation({ summary: "Delete a webhook" })
  async delete(@Param("id") id: string) {
    const deleted = this.webhookService.delete(id);
    return { deleted };
  }
}
