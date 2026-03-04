import {
  Controller,
  Get,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { AuditService } from "./audit.service";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../../common/guards/roles.guard";

@ApiTags("Audit")
@ApiBearerAuth()
@UseGuards(AuthGuard("jwt"), RolesGuard)
@Controller("audit")
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get()
  @Roles("ADMIN", "PI")
  @ApiOperation({ summary: "List audit logs (admin/PI only)" })
  async findAll(
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("limit", new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query("entityType") entityType?: string,
    @Query("entityId") entityId?: string,
    @Query("userId") userId?: string,
    @Query("action") action?: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
  ) {
    return this.auditService.findAll(page, Math.min(limit, 200), {
      entityType,
      entityId,
      userId,
      action,
      from,
      to,
    });
  }

  @Get("entity")
  @ApiOperation({ summary: "Get audit trail for specific entity" })
  async findByEntity(
    @Query("type") entityType: string,
    @Query("id") entityId: string,
  ) {
    return this.auditService.findByEntity(entityType, entityId);
  }
}
