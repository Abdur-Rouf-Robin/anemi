import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { TogetherController } from "./together.controller";
import { TogetherGateway } from "./together.gateway";
import { TogetherService } from "./together.service";

@Module({
  imports: [AuthModule],
  controllers: [TogetherController],
  providers: [TogetherService, TogetherGateway]
})
export class TogetherModule {}
