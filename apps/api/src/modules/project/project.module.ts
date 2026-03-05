import { Module } from "@nestjs/common";
import { ProjectService } from "./project.service";
import { ProjectController } from "./project.controller";
import { PermissionGuard } from "../../common/guards/permission.guard";

@Module({
  controllers: [ProjectController],
  providers: [ProjectService, PermissionGuard],
  exports: [ProjectService],
})
export class ProjectModule {}
