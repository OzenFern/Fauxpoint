import { sql } from "drizzle-orm";
import { db } from "../../libs/db";
import { NotReadyError } from "./errors.ts";
import type { LiveResponse, ReadyResponse } from "./model.ts";

const timestamp = (): string => new Date().toISOString();

export const getLive = (): LiveResponse => ({
  status: "alive",
  uptime: process.uptime(),
  timestamp: timestamp(),
});

export const checkReadiness = async (): Promise<ReadyResponse> => {
  const start = performance.now();
  const latencyMs = (): number => Math.round(performance.now() - start);

  try {
    await db.execute(sql`SELECT 1`);
  } catch {
    throw new NotReadyError({
      status: "not_ready",
      checks: {
        database: { status: "down", latencyMs: latencyMs() },
      },
      timestamp: timestamp(),
    });
  }

  return {
    status: "ready",
    checks: {
      database: { status: "up", latencyMs: latencyMs() },
    },
    timestamp: timestamp(),
  };
};
