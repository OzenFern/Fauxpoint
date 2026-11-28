import { beforeAll, describe, expect, it } from "bun:test";
import { sql } from "drizzle-orm";
import { db } from "../src/libs/db";

describe("database connection", () => {
  let result: Record<"version" | "c_user" | "c_db", string>;

  beforeAll(async () => {
    const rows = await db.execute(
      sql`SELECT version(), current_user AS c_user, current_database() AS c_db`,
    );
    result = rows[0] as typeof result;
  });

  it("returns a result row", () => {
    expect(result).toBeDefined();
    expect(result.version).toBeTruthy();
    expect(result.c_user).toBeTruthy();
    expect(result.c_db).toBeTruthy();
  });

  it("is talking to PostgreSQL", () => {
    expect(result.version).toMatch(/^PostgreSQL \d+/);
  });

  it("connects to the database and user mentioned in environment variables", () => {
    expect(result.c_user).toBe(process.env.POSTGRES_USER as string);
    expect(result.c_db).toBe(process.env.POSTGRES_DB as string);
  });
});
