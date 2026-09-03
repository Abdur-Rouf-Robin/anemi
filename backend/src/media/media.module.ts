import { Module } from "@nestjs/common";

import { EncodeService } from "./encode.service";
import { MediaController } from "./media.controller";

@Module({
  controllers: [MediaController],
  providers: [EncodeService],
  exports: [EncodeService]
})
export class MediaModule {}
