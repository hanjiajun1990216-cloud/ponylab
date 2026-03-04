import { Module } from "@nestjs/common";
import { InstrumentService } from "./instrument.service";
import { InstrumentController } from "./instrument.controller";

@Module({
  controllers: [InstrumentController],
  providers: [InstrumentService],
  exports: [InstrumentService],
})
export class InstrumentModule {}
