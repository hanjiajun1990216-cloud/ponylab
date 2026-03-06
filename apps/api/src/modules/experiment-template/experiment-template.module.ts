import { Module } from "@nestjs/common";
import { PrismaModule } from "../../common/prisma/prisma.module";
import { ExperimentTemplateController } from "./experiment-template.controller";
import { ExperimentTemplateService } from "./experiment-template.service";

@Module({
  imports: [PrismaModule],
  controllers: [ExperimentTemplateController],
  providers: [ExperimentTemplateService],
})
export class ExperimentTemplateModule {}
