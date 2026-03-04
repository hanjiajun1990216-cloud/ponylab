import { Module } from "@nestjs/common";
import { ProtocolService } from "./protocol.service";
import { ProtocolController } from "./protocol.controller";

@Module({
  controllers: [ProtocolController],
  providers: [ProtocolService],
  exports: [ProtocolService],
})
export class ProtocolModule {}
