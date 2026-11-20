import { describe, expect, it } from "bun:test";
import { treaty } from "@elysia/eden";
import app, { type App } from "../src/app";

describe("GET /health", () => {
  it("returns 200 and an OK status", async () => {
    const api = treaty<App>(app);
    const { data, status } = await api.health.get();

    expect(status).toBe(200);
    expect(data).toMatchObject({ status: "OK" });
  });
});
