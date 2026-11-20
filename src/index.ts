import openapi, { fromTypes } from "@elysia/openapi";
import app from "./app.ts";

app
  .use(
    openapi({
      references: fromTypes(),
    }),
  )
  .listen(3000);

const appUrl = `${app.server?.protocol}://${app.server?.hostname}:${app.server?.port}`;

console.log(`🦊 Elysia is running at ${appUrl}`);
console.log(`Refer to documentation at ${appUrl}/openapi`);
