import { Module, NestModule, MiddlewareConsumer } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
// ScheduleModule temporarily disabled for E2E rebuild
// import { ScheduleModule } from "@nestjs/schedule";
import { PrismaModule } from "./common/prisma/prisma.module";
import { AuthModule } from "./modules/auth/auth.module";
import { UserModule } from "./modules/user/user.module";
import { TeamModule } from "./modules/team/team.module";
import { ProjectModule } from "./modules/project/project.module";
import { ExperimentModule } from "./modules/experiment/experiment.module";
import { SampleModule } from "./modules/sample/sample.module";
import { InventoryModule } from "./modules/inventory/inventory.module";
import { ProtocolModule } from "./modules/protocol/protocol.module";
import { InstrumentModule } from "./modules/instrument/instrument.module";
import { AuditModule } from "./modules/audit/audit.module";
import { FileModule } from "./modules/file/file.module";
import { HealthModule } from "./modules/health/health.module";
import { DirectionModule } from "./modules/direction/direction.module";
import { InvitationModule } from "./modules/invitation/invitation.module";
import { ApplicationModule } from "./modules/application/application.module";
import { CommentModule } from "./modules/comment/comment.module";
import { AnnouncementModule } from "./modules/announcement/announcement.module";
import { NotificationModule } from "./modules/notification/notification.module";
import { TaskStepModule } from "./modules/task-step/task-step.module";
import { TaskModule } from "./modules/task/task.module";
import { ExportModule } from "./modules/export/export.module";
import { ExperimentTemplateModule } from "./modules/experiment-template/experiment-template.module";
import { ProtocolExecutionModule } from "./modules/protocol-execution/protocol-execution.module";
import { InventoryColumnModule } from "./modules/inventory-column/inventory-column.module";
// AIModule temporarily disabled for E2E (depends on @ponylab/ai TS package)
// import { AIModule } from "./modules/ai/ai.module";
import { StorageModule } from "./modules/storage/storage.module";
import { WebhookModule } from "./modules/webhook/webhook.module";
import { IpWhitelistMiddleware } from "./common/middleware/ip-whitelist.middleware";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UserModule,
    TeamModule,
    ProjectModule,
    ExperimentModule,
    SampleModule,
    InventoryColumnModule, // Must be before InventoryModule to avoid :id route conflict
    InventoryModule,
    ProtocolModule,
    InstrumentModule,
    AuditModule,
    FileModule,
    HealthModule,
    // New modules
    DirectionModule,
    InvitationModule,
    ApplicationModule,
    CommentModule,
    AnnouncementModule,
    NotificationModule,
    TaskStepModule,
    TaskModule,
    ExportModule,
    ExperimentTemplateModule,
    ProtocolExecutionModule,
    // AIModule,
    StorageModule,
    WebhookModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(IpWhitelistMiddleware)
      .exclude("health{/*path}")
      .forRoutes("*");
  }
}
