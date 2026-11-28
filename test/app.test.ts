import { describe, expect, it } from "bun:test";
import app from "../src/app";

describe("app", () => {
  it("registers the health routes", () => {
    const routes = app.routes.map((route) => `${route.method} ${route.path}`);

    expect(routes).toContain("GET /health/live");
    expect(routes).toContain("GET /health/ready");
  });

  it("returns 404 for unknown routes", async () => {
    const res = await app.handle(
      new Request("http://localhost/does-not-exist"),
    );

    expect(res.status).toBe(404);
  });
});
