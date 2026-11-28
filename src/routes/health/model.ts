export type LiveResponse = {
  status: "alive";
  uptime: number;
  timestamp: string;
};

export type DatabaseCheck = {
  status: "up" | "down";
  latencyMs: number;
};

export type ReadyResponse = {
  status: "ready" | "not_ready";
  checks: {
    database: DatabaseCheck;
  };
  timestamp: string;
};
