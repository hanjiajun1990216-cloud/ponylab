import { Module } from "@nestjs/common";
import { ProtocolService } from "./protocol.service";
import { ProtocolController } from "./protocol.controller";
import { NotificationModule } from "../notification/notification.module";

@Module({
  imports: [NotificationModule],
  controllers: [ProtocolController],
  providers: [ProtocolService],
  exports: [ProtocolService],
})
export class ProtocolModule {}
