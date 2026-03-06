import { Module } from "@nestjs/common";
import { PrismaModule } from "../../common/prisma/prisma.module";
import { ProtocolExecutionController } from "./protocol-execution.controller";
import { ProtocolExecutionService } from "./protocol-execution.service";

@Module({
  imports: [PrismaModule],
  controllers: [ProtocolExecutionController],
  providers: [ProtocolExecutionService],
})
export class ProtocolExecutionModule {}
