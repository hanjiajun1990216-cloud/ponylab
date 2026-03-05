import { Module } from "@nestjs/common";
import { TaskStepService } from "./task-step.service";
import { TaskStepController } from "./task-step.controller";

@Module({
  controllers: [TaskStepController],
  providers: [TaskStepService],
  exports: [TaskStepService],
})
export class TaskStepModule {}
