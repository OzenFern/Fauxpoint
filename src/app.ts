import { Elysia } from "elysia";

const app = new Elysia().get("/", "Fauxpoint: Mock API").get("/health", () => ({
  status: "OK",
  uptime: process.uptime(),
  timestamp: new Date().toISOString(),
}));

export default app;
export type App = typeof app;
