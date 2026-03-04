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
import { InventoryService } from "./inventory.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@ApiTags("Inventory")
@ApiBearerAuth()
@UseGuards(AuthGuard("jwt"))
@Controller("inventory")
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  @Post()
  @ApiOperation({ summary: "Create inventory item" })
  async create(@Body() body: any) {
    return this.inventoryService.create(body);
  }

  @Get()
  @ApiOperation({ summary: "List inventory items" })
  async findAll(
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("limit", new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query("category") category?: string,
  ) {
    return this.inventoryService.findAll(page, Math.min(limit, 100), { category });
  }

  @Get("low-stock")
  @ApiOperation({ summary: "Get items below minimum stock" })
  async getLowStock() {
    return this.inventoryService.getLowStockItems();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get inventory item with history" })
  async findById(@Param("id") id: string) {
    return this.inventoryService.findById(id);
  }

  @Post(":id/adjust")
  @ApiOperation({ summary: "Adjust inventory quantity" })
  async adjust(
    @Param("id") id: string,
    @Body() body: { action: "IN" | "OUT" | "ADJUST"; amount: number; reason?: string },
    @CurrentUser("id") userId: string,
  ) {
    return this.inventoryService.adjustQuantity(id, body.action, body.amount, userId, body.reason);
  }
}
