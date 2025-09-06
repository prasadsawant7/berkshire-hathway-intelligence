import "dotenv/config";
import crypto from "node:crypto";
import fg from "fast-glob";
import { MDocument } from "@mastra/rag";
import { embedMany } from "ai";
import { openai } from "@ai-sdk/openai";
import { PgVector } from "@mastra/pg";
import { extractPdf } from "./pdf/extract-pdf";

async function ingestOne(file: string, store: PgVector) {
  const pages = await extractPdf(file);

  const doc = new MDocument({
    type: "text",
    docs: pages.map((p) => ({ text: p.text, metadata: p.metadata })),
  });

  const chunks = await doc.chunk({
    strategy: "recursive",
    maxSize: 300,
    overlap: 50,
  });

  const { embeddings } = await embedMany({
    values: chunks.map((chunk) => chunk.text),
    model: openai.embedding("text-embedding-3-small", {
      dimensions: 1536,
    }),
  });

  await store.upsert({
    indexName: "embeddings",
    vectors: embeddings,
    metadata: chunks.map((chunk) => ({
      id: crypto.randomUUID(),
      text: chunk.text,
      year: chunk.metadata?.year || "Unknown",
      page: chunk.metadata?.page || "Unknown",
      source: chunk.metadata?.source || "Unknown",
      section: chunk.metadata?.section || "Unknown",
      createdAt: new Date().toISOString(),
      version: "1.0",
    })),
  });

  return `Ingested ${chunks.length} chunks from ${file}`;
}

async function run() {
  const files = await fg("data/pdfs/{2019,2020,2021,2022,2023,2024}.pdf");

  const store = new PgVector({
    connectionString: process.env.DATABASE_URL!,
  });

  await store.createIndex({
    indexName: "embeddings",
    dimension: 1536,
    metric: "cosine",
  });

  const responses = [];

  for (const file of files) {
    responses.push(await ingestOne(file, store));
  }

  return responses;
}

run()
  .then((res) => console.log(res))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
