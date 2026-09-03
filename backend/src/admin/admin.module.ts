import { Module } from "@nestjs/common";

import { CatalogModule } from "../catalog/catalog.module";
import { CommunityModule } from "../community/community.module";
import { MediaModule } from "../media/media.module";
import { StaffMfaGuard } from "../auth/guards/staff-mfa.guard";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { ScheduleMailService } from "./schedule-mail.service";

@Module({
  imports: [MediaModule, CommunityModule, CatalogModule],
  controllers: [AdminController],
  providers: [AdminService, ScheduleMailService, StaffMfaGuard]
})
export class AdminModule {}
