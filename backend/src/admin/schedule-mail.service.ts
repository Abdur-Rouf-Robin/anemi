import { Injectable, Logger, OnModuleInit } from "@nestjs/common";

import { CatalogService } from "../catalog/catalog.service";
import { PrismaService } from "../prisma/prisma.service";
import { mailFrom, mailTransport, smtpConfigured } from "./mailer";

const WEEK_MS = 6.5 * 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

@Injectable()
export class ScheduleMailService implements OnModuleInit {
  private readonly logger = new Logger(ScheduleMailService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly catalog: CatalogService
  ) {}

  onModuleInit() {
    void this.tick();
    setInterval(() => void this.tick(), HOUR_MS);
  }

  async tick() {
    if (!smtpConfigured()) return;
    const settings = await this.prisma.siteSetting.findUnique({ where: { id: "default" } });
    if (!settings?.scheduleMailEnabled) return;
    if (settings.scheduleMailLastAt && Date.now() - settings.scheduleMailLastAt.getTime() < WEEK_MS) {
      return;
    }
    try {
      await this.sendDigest();
      await this.prisma.siteSetting.upsert({
        where: { id: "default" },
        update: { scheduleMailLastAt: new Date() },
        create: { id: "default", scheduleMailLastAt: new Date(), scheduleMailEnabled: true }
      });
    } catch (error) {
      this.logger.error(error instanceof Error ? error.message : "Weekly schedule mail failed");
    }
  }

  async sendDigest() {
    const subscribers = await this.prisma.newsletter.findMany({ select: { email: true } });
    if (!subscribers.length) return;
    const transport = mailTransport();
    if (!transport) return;
    const { days } = await this.catalog.schedule();
    const lines = ["This week on Anemi", ""];
    for (const day of days) {
      if (!day.items.length) continue;
      lines.push(day.date);
      for (const item of day.items) {
        lines.push(`  ${item.title.name} — S${item.seasonNumber}E${item.number} ${item.name}`);
      }
      lines.push("");
    }
    if (lines.length <= 2) {
      lines.push("No dated episodes on the schedule yet.");
    }
    const text = lines.join("\n");
    for (const row of subscribers) {
      await transport.sendMail({
        from: mailFrom(),
        to: row.email,
        subject: "Anemi weekly schedule",
        text
      });
    }
    await this.prisma.newsletterCampaign.create({
      data: {
        subject: "Anemi weekly schedule",
        body: text,
        status: "sent",
        sentCount: subscribers.length,
        sentAt: new Date()
      }
    });
    this.logger.log(`Weekly schedule mailed to ${subscribers.length} subscriber(s)`);
  }
}
