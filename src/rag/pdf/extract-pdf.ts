import fs from "node:fs/promises";
import path from "node:path";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

export type PdfPage = {
  text: string;
  metadata: {
    source: string;
    year?: string;
    page: number;
    pageCount: number;
    section?: string;
    title?: string | null;
  };
};

const normalize = (s: string) =>
  s
    .replace(/-\n/g, "")
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

function guessSection(t: string): string | undefined {
  const head = t.slice(0, 400).toLowerCase();
  if (head.includes("to the shareholders")) return "Letter to Shareholders";
  if (head.includes("charlie munger")) return "Munger Tribute";
  if (/berkshire[’'`]s performance vs\. the s&p 500/i.test(t))
    return "Performance Table";
  return undefined;
}

export async function extractPdf(filePath: string): Promise<PdfPage[]> {
  const data = new Uint8Array(await fs.readFile(filePath));
  const pdf = await getDocument({ data }).promise;

  const file = path.basename(filePath);
  const year = file.match(/\b(19|20)\d{2}\b/)?.[0];

  const pages: PdfPage[] = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();

    const raw = (content.items as any[])
      .map((it) => (typeof (it as any).str === "string" ? (it as any).str : ""))
      .join("\n");

    const text = normalize(raw);
    pages.push({
      text,
      metadata: {
        source: filePath,
        year,
        page: p,
        pageCount: pdf.numPages,
        section: guessSection(text),
        title: null,
      },
    });
  }
  return pages;
}
