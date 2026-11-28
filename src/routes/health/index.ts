import { Elysia } from "elysia";
import { NotReadyError } from "./errors.ts";
import { checkReadiness, getLive } from "./service.ts";

const health = new Elysia({ prefix: "/health" })
  .onError(({ error, set }) => {
    if (error instanceof NotReadyError) {
      set.status = error.status;
      return error.readiness;
    }

    set.status = 500;
    return { status: "error", message: "Internal server error" };
  })
  .get("/live", getLive)
  .get("/ready", checkReadiness);

export default health;
