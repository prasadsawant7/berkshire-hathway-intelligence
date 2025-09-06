import "dotenv/config";
import { z } from "zod";
import { embed } from "ai";
import { openai } from "@ai-sdk/openai";
import { PgVector } from "@mastra/pg";

const MAX_CHARS_PER_SNIPPET = 700;

export const berkshireSearchTool = {
  name: "search_berkshire_documents",
  description:
    "Search through Berkshire Hathaway shareholder letters for relevant information",
  inputSchema: z.object({
    search_query: z
      .string()
      .describe("The search query to find relevant information"),
  }),
  execute: async (args: any) => {
    const search_query = args.search_query || args.context?.search_query || "";

    if (!search_query) {
      return {
        contexts: [],
        instruction: "No search query provided.",
      };
    }

    const { embedding } = await embed({
      value: search_query,
      model: openai.embedding("text-embedding-3-small", { dimensions: 1536 }),
    });

    const store = new PgVector({
      connectionString: process.env.DATABASE_URL!,
    });

    const results = await store.query({
      indexName: "embeddings",
      queryVector: embedding,
      topK: 10,
    });

    const contexts = results.map((r, i) => ({
      id: r.id ?? `doc_${i}`,
      year: (r.metadata as any)?.year || "Unknown",
      page: (r.metadata as any)?.page || "Unknown",
      text: ((r.metadata as any)?.text ?? "").slice(0, MAX_CHARS_PER_SNIPPET),
    }));

    return {
      contexts,
      instruction: `
Use ONLY the provided contexts from Berkshire Hathaway shareholder letters to answer. Do not call tools again.

Requirements:
- Ground every claim in the contexts; avoid outside knowledge or speculation.
- Cite facts inline as (YEAR, p.PAGE). If multiple, cite each where used.
- When directly quoting, use quotation marks and include the year, e.g., "…" (2019, p. 4).
- If the answer is not supported by the contexts, say so clearly.
- Prefer concise, plain-English explanations of financial concepts.
- Note how views evolved over time when relevant (include years).
- End with a short "Sources" list showing (YEAR, p.PAGE) for the snippets you used.

Response format:
1) Answer
2) Key quote(s) [optional]
3) Sources: (YEAR, p.PAGE),
      `,
    };
  },
} as const;
