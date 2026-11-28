import type { ReadyResponse } from "./model.ts";

export class NotReadyError extends Error {
  readonly status = 503;

  constructor(readonly readiness: ReadyResponse) {
    super("Service is not ready");
    this.name = "NotReadyError";
  }
}
