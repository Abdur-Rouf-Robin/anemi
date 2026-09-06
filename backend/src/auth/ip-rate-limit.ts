import { HttpException, HttpStatus } from "@nestjs/common";

type Bucket = { count: number; resetAt: number };

const hits = new Map<string, Bucket>();

export function allowIpHit(key: string, max: number, windowMs: number): void {
  const now = Date.now();
  const current = hits.get(key);
  if (!current || current.resetAt < now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  current.count += 1;
  if (current.count > max) {
    throw new HttpException("Too many requests. Try later.", HttpStatus.TOO_MANY_REQUESTS);
  }
}

export function requestIp(req: { ip?: string; socket?: { remoteAddress?: string } }): string {
  return req.ip || req.socket?.remoteAddress || "unknown";
}
