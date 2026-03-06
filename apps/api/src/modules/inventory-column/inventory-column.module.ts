import { Module } from "@nestjs/common";
import { PrismaModule } from "../../common/prisma/prisma.module";
import { InventoryColumnController } from "./inventory-column.controller";
import { InventoryColumnService } from "./inventory-column.service";

@Module({
  imports: [PrismaModule],
  controllers: [InventoryColumnController],
  providers: [InventoryColumnService],
})
export class InventoryColumnModule {}
