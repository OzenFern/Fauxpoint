import { afterEach, describe, expect, it, mock, spyOn } from "bun:test";
import { treaty } from "@elysia/eden";
import type { EdenFetchError } from "@elysia/eden";
import app, { type App } from "../src/app";
import { db } from "../src/libs/db";
import { NotReadyError } from "../src/routes/health/errors.ts";
import { checkReadiness } from "../src/routes/health/service.ts";
import type { ReadyResponse } from "../src/routes/health/model.ts";

const api = treaty<App>(app);

describe("/health", () => {
  describe("GET /health/live", () => {
    it("returns 200 and an alive status", async () => {
      const { data, status } = await api.health.live.get();

      expect(status).toBe(200);
      expect(data).toMatchObject({ status: "alive" });
      expect(data?.uptime).toBeGreaterThanOrEqual(0);
      expect(data?.timestamp).toBeTruthy();
    });
  });

  describe("GET /health/ready", () => {
    it("returns 200 and a ready status when the database is reachable", async () => {
      const { data, status } = await api.health.ready.get();

      expect(status).toBe(200);
      expect(data).toMatchObject({
        status: "ready",
        checks: { database: { status: "up" } },
      });
      expect(data?.checks.database.latencyMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe("failure handling", () => {
    afterEach(() => mock.restore());

    it("checkReadiness rejects with NotReadyError when the database is unreachable", async () => {
      spyOn(db, "execute").mockRejectedValue(new Error("connection refused"));

      const error = await checkReadiness().catch((e: unknown) => e);
      expect(error).toBeInstanceOf(NotReadyError);
    });

    it("GET /health/ready returns 503 with a not_ready body", async () => {
      spyOn(db, "execute").mockRejectedValue(new Error("connection refused"));

      const { error, status } = await api.health.ready.get();
      const body = (error as EdenFetchError<number, ReadyResponse>).value;

      expect(status).toBe(503);
      expect(body.status).toBe("not_ready");
      expect(body.checks.database.status).toBe("down");
      expect(body.checks.database.latencyMs).toBeGreaterThanOrEqual(0);
      expect(body.timestamp).toBeTruthy();
    });

    it("GET /health/ready returns 500 when an unexpected error occurs", async () => {
      spyOn(performance, "now").mockImplementation(() => {
        throw new Error("timer unavailable");
      });

      const { error, status } = await api.health.ready.get();
      const body = (
        error as EdenFetchError<number, { status: string; message: string }>
      ).value;

      expect(status).toBe(500);
      expect(body).toMatchObject({
        status: "error",
        message: "Internal server error",
      });
    });

    it("GET /health/live still returns 200 when the database is down", async () => {
      spyOn(db, "execute").mockRejectedValue(new Error("connection refused"));

      const { data, status } = await api.health.live.get();

      expect(status).toBe(200);
      expect(data).toMatchObject({ status: "alive" });
    });
  });
});
