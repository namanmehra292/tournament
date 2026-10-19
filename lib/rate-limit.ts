import { RateLimiterMemory } from "rate-limiter-flexible";
import { prisma } from "./prisma";

// ---------------------------------------------------------------
// Two layers of rate limiting:
// 1. In-memory token-bucket limiters (fast, per-instance) for
//    immediate request throttling on API routes.
// 2. A DB-backed lockout check for login, so brute force is capped
//    even across restarts/instances (in-memory alone resets on deploy).
//
// NOTE: RateLimiterMemory is per-process. On Render with multiple
// instances, swap to RateLimiterRedis backed by a Redis add-on for
// a shared limit — the interface below is a drop-in replacement
// (see comment at bottom).
// ---------------------------------------------------------------

const registrationLimiter = new RateLimiterMemory({
  points: 5, // 5 submissions
  duration: 60 * 10, // per 10 minutes
  blockDuration: 60 * 30, // block for 30 min after exceeding
});

const loginLimiter = new RateLimiterMemory({
  points: 8,
  duration: 60 * 5,
  blockDuration: 60 * 15,
});

export async function checkRegistrationRateLimit(key: string) {
  try {
    await registrationLimiter.consume(key);
    return { allowed: true };
  } catch {
    return { allowed: false };
  }
}

export async function checkLoginRateLimit(email: string, ip: string) {
  const key = `${email}:${ip}`;
  try {
    await loginLimiter.consume(key);
  } catch {
    return { allowed: false };
  }

  // Secondary DB-backed check: lock out after 10 failed attempts
  // for this email in the last 15 minutes, regardless of IP —
  // protects against distributed credential-stuffing.
  const since = new Date(Date.now() - 15 * 60 * 1000);
  const recentFailures = await prisma.loginAttempt.count({
    where: { email, success: false, createdAt: { gte: since } },
  });

  if (recentFailures >= 10) {
    return { allowed: false };
  }

  return { allowed: true };
}

export async function recordLoginAttempt(params: {
  userId?: string;
  email: string;
  ipAddress: string;
  success: boolean;
}) {
  await prisma.loginAttempt.create({ data: params });
}

export function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return "unknown";
}

// --- To scale across multiple Render instances later ---
// import { RateLimiterRedis } from "rate-limiter-flexible";
// import Redis from "ioredis";
// const redisClient = new Redis(process.env.REDIS_URL!);
// const registrationLimiter = new RateLimiterRedis({ storeClient: redisClient, points: 5, duration: 600, blockDuration: 1800 });
