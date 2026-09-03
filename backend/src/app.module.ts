import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { AdminModule } from "./admin/admin.module";
import { AuthModule } from "./auth/auth.module";
import { CatalogModule } from "./catalog/catalog.module";
import { CommentsModule } from "./comments/comments.module";
import { CommunityModule } from "./community/community.module";
import { HealthController } from "./health/health.controller";
import { LibraryModule } from "./library/library.module";
import { MediaModule } from "./media/media.module";
import { PrismaModule } from "./prisma/prisma.module";
import { TogetherModule } from "./together/together.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env", "../.env"]
    }),
    PrismaModule,
    AuthModule,
    CatalogModule,
    CommentsModule,
    CommunityModule,
    TogetherModule,
    LibraryModule,
    MediaModule,
    AdminModule
  ],
  controllers: [HealthController]
})
export class AppModule {}
