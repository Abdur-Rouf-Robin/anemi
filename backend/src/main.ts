import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import compression from "compression";
import cookieParser from "cookie-parser";

import { AppModule } from "./app.module";
import { corsOrigins } from "./security/cors-origins";
import { initSentry } from "./security/sentry";
import { securityHeaders } from "./security/security-headers.middleware";

async function bootstrap() {
  await initSentry();
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableShutdownHooks();
  app.set("trust proxy", 1);
  app.disable("x-powered-by");
  app.use(securityHeaders);
  app.use(cookieParser());
  app.use(compression());

  const originList = corsOrigins();

  if (process.env.NODE_ENV === "production" && originList.length === 0) {
    console.error("[anemi] CORS_ORIGINS must be set in production.");
    process.exit(1);
  }
  if (process.env.NODE_ENV === "production" && originList.includes("*")) {
    console.error("[anemi] CORS_ORIGINS=* is not allowed in production.");
    process.exit(1);
  }

  const jwt = process.env.JWT_SECRET?.trim() ?? "";
  if (process.env.NODE_ENV === "production") {
    if (!jwt || jwt === "change-me-to-a-long-random-string" || jwt.length < 32) {
      console.error("[anemi] JWT_SECRET must be a random string of at least 32 characters in production.");
      process.exit(1);
    }
  } else if (!jwt || jwt === "change-me-to-a-long-random-string") {
    console.warn("[anemi] JWT_SECRET is still the example value. Change it before you go live.");
  }

  app.enableCors({
    origin: originList.length === 0 ? true : originList,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true
    })
  );

  const port = Number(process.env.PORT ?? 4100);
  await app.listen(port, "0.0.0.0");
  console.log(`[anemi] API http://127.0.0.1:${port}`);
}

bootstrap();
