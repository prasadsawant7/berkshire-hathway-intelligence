import { z } from "zod";
import { createWorkflow } from "@mastra/core/workflows";
import { berkshireStep, berkshireStreamingStep } from "../steps/berkshire-step";

export const berkshireWorkflow = createWorkflow({
  id: "berkshire-workflow",
  description: "Simple workflow to query Berkshire agent",
  inputSchema: z.object({
    search_query: z.string(),
  }),
  outputSchema: z.string(),
})
  .then(berkshireStep)
  .commit();

export const berkshireStreamingWorkflow = createWorkflow({
  id: "berkshire-streaming-workflow",
  description:
    "Streaming workflow to query Berkshire agent with real-time responses",
  inputSchema: z.object({
    search_query: z.string(),
  }),
  outputSchema: z.object({
    stream: z.any(),
  }),
})
  .then(berkshireStreamingStep)
  .commit();
