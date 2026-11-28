import { Elysia } from "elysia";
import health from "./routes/health";

const app = new Elysia().use(health);

export default app;
export type App = typeof app;
