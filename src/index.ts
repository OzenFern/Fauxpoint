import { Elysia } from "elysia";
import openapi, { fromTypes } from "@elysia/openapi";

const app = new Elysia()
  .use(
    openapi({
      references: fromTypes(),
    }),
  )
  .get("/", () => "Hello Elysia")
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
