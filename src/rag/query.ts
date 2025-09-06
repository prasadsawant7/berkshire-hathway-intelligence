import "dotenv/config";
import { openai } from "@ai-sdk/openai";
import { embed } from "ai";
import { PgVector } from "@mastra/pg";
import { rerankWithScorer as rerank, CohereRelevanceScorer } from "@mastra/rag";

async function run() {
  const query = "What does Warren Buffett think about cryptocurrency?";

  const { embedding } = await embed({
    value: query,
    model: openai.embedding("text-embedding-3-small", {
      dimensions: 1536,
    }),
  });

  const store = new PgVector({
    connectionString: process.env.DATABASE_URL!,
  });

  const vectorSearchResults = await store.query({
    indexName: "embeddings",
    queryVector: embedding,
    topK: 10,
  });

  const scorer = new CohereRelevanceScorer(
    "rerank-v3.5",
    process.env.COHERE_API_KEY!
  );
  const rerankedResults = await rerank({
    results: vectorSearchResults,
    query: query,
    scorer,
    options: {
      weights: {
        semantic: 0.5,
        vector: 0.3,
        position: 0.2,
      },
      topK: 3,
    },
  });

  return rerankedResults;
}

run()
  .then((values) => {
    values.map((value) => {
      console.log(value.result.metadata);
    });
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
