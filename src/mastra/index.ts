import { Mastra } from "@mastra/core/mastra";
import { PinoLogger } from "@mastra/loggers";
import { LibSQLStore } from "@mastra/libsql";
import { berkshireAgent } from "./agents/berkshire-agent";
import {
  berkshireWorkflow,
  berkshireStreamingWorkflow,
} from "./workflows/berkshire-workflow";

export const mastra = new Mastra({
  workflows: {
    berkshireWorkflow,
    berkshireStreamingWorkflow,
  },
  agents: { berkshireAgent },
  storage: new LibSQLStore({
    // stores telemetry, evals, ... into memory storage, if it needs to persist, change to file:../mastra.db
    url: ":memory:",
  }),
  logger: new PinoLogger({
    name: "Mastra",
    level: "info",
  }),
});
