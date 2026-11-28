import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/libs/db/schema",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.POSTGRES_URL as string,
  },
  verbose: true,
});
