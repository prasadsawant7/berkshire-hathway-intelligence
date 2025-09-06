import z from "zod";
import crypto from "node:crypto";
import { createStep } from "@mastra/core/workflows";
import { berkshireAgent } from "../agents/berkshire-agent";

export const berkshireStep = createStep({
  id: "berkshire-step",
  description: "Answer questions using Berkshire Hathaway shareholder letters",
  inputSchema: z.object({
    search_query: z.string(),
  }),
  outputSchema: z.string(),
  execute: async ({ inputData }) => {
    const response = await berkshireAgent.generate([
      {
        id: crypto.randomUUID(),
        role: "user",
        content: inputData.search_query,
      },
    ]);
    return response.text;
  },
});

export const berkshireStreamingStep = createStep({
  id: "berkshire-streaming-step",
  description: "Stream answers using Berkshire Hathaway shareholder letters",
  inputSchema: z.object({
    search_query: z.string(),
  }),
  outputSchema: z.object({
    stream: z.any(),
  }),
  execute: async ({ inputData }) => {
    const stream = await berkshireAgent.stream([
      {
        id: crypto.randomUUID(),
        role: "user",
        content: inputData.search_query,
      },
    ]);
    return { stream };
  },
});
