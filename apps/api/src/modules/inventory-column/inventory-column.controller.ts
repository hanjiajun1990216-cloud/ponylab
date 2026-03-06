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
import { InventoryColumnService } from "./inventory-column.service";
import { PermissionGuard } from "../../common/guards/permission.guard";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";

@ApiTags("Inventory")
@ApiBearerAuth()
@UseGuards(AuthGuard("jwt"), PermissionGuard)
@Controller("inventory/columns")
export class InventoryColumnController {
  constructor(
    private readonly inventoryColumnService: InventoryColumnService,
  ) {}

  @Get()
  @ApiOperation({ summary: "获取团队自定义列列表" })
  @ApiQuery({ name: "teamId", required: true, description: "团队 ID" })
  findByTeam(@Query("teamId") teamId: string) {
    return this.inventoryColumnService.findByTeam(teamId);
  }

  @Post()
  @RequirePermission("inventory:admin")
  @ApiOperation({ summary: "创建自定义列" })
  create(
    @Body()
    body: {
      teamId: string;
      name: string;
      type: string;
      options?: any;
      isRequired?: boolean;
    },
  ) {
    return this.inventoryColumnService.create(body);
  }

  @Delete(":id")
  @RequirePermission("inventory:admin")
  @ApiOperation({ summary: "删除自定义列" })
  delete(@Param("id") id: string, @Query("teamId") teamId: string) {
    return this.inventoryColumnService.delete(id, teamId);
  }
}
