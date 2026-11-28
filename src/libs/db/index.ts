import { drizzle } from "drizzle-orm/bun-sql";
import { SQL } from "bun";

const client = new SQL({
  url: process.env.POSTGRES_URL as string,
  max: 20,
  idleTimeout: 30,
  maxLifetime: 1800, // 30 minutes
  connectionTimeout: 10,

  connection: {
    application_name: "fauxpoint",
  },
});

export const db = drizzle({ client });
