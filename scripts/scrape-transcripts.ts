/**
 * scrape-transcripts.ts
 *
 * Fetches the most recent earnings call transcript for each ticker via the
 * Finnhub API, extracts supply-chain relationships using RocketRide, and
 * writes them into Neo4j.
 *
 * Earnings calls are far more explicit than 10-K filings — executives and
 * analysts name customers/suppliers directly ("our Apple program", "TSMC
 * remains our largest customer at ~X% of revenue").
 *
 * Usage:
 *   npx tsx scripts/scrape-transcripts.ts
 *   npx tsx scripts/scrape-transcripts.ts --debug
 *
 * Prerequisites:
 *   FINNHUB_API_KEY in .env.local  (free at https://finnhub.io)
 *   ROCKETRIDE_URI / ROCKETRIDE_API_KEY / ROCKETRIDE_OPENAI_KEY in .env.local
 *   NEO4J_URI / NEO4J_USER / NEO4J_PASSWORD in .env.local
 */

import { config } from "dotenv";
import { resolve, join } from "path";
config({ path: resolve(__dirname, "../.env.local") });

import { RocketRideClient, Question } from "rocketride";
import { runQuery } from "../lib/neo4j";

// ── Config ────────────────────────────────────────────────────────────────────

const TICKERS = [
  // Apple component suppliers — analysts always ask about Apple concentration
  "CRUS",  // Cirrus Logic      ~85% Apple
  "SWKS",  // Skyworks          ~60% Apple (RF chips)
  "QRVO",  // Qorvo             ~35% Apple (RF chips)
  "JBL",   // Jabil             contract manufacturer, large Apple exposure
  "AMKR",  // Amkor Technology  chip packaging, names Apple & Qualcomm

  // Semiconductor equipment — name TSMC, Samsung, Intel constantly
  "AMAT",  // Applied Materials
  "LRCX",  // Lam Research
  "KLAC",  // KLA Corporation
  "ENTG",  // Entegris          semiconductor materials

  // Auto parts — name Ford, GM, Stellantis by revenue share
  "LEA",   // Lear Corporation
  "ALV",   // Autoliv
  "APTV",  // Aptiv
  "MGA",   // Magna International
  "BWA",   // BorgWarner

  // Aerospace components — name Boeing, Airbus, Raytheon
  "TDG",   // TransDigm
  "HEI",   // Heico
  "DCO",   // Ducommun
  "CW",    // Curtiss-Wright

  // Contract electronics — name Apple, Microsoft, Amazon
  "FLEX",  // Flex Ltd
  "CLS",   // Celestica
];

const DEBUG = process.argv.includes("--debug");

// Finnhub free tier: 60 calls/minute
const FINNHUB_DELAY_MS = 1100;

// ── Types ─────────────────────────────────────────────────────────────────────

interface Relationship {
  fromCompany: string;
  toCompany:   string;
  type:        "CUSTOMER_OF" | "SUPPLIES_TO";
  weightPct:   number | null;
}

interface FinnhubSpeech {
  name:   string;    // speaker name/role
  speech: string[];  // array of spoken paragraphs
}

interface FinnhubTranscript {
  symbol:     string;
  year:       number;
  quarter:    number;
  transcript: FinnhubSpeech[];
}

interface FinnhubTranscriptListItem {
  id:      string;
  title:   string;
  date:    string;
  symbol:  string;
}

// ── RocketRide client ─────────────────────────────────────────────────────────

const rrClient = new RocketRideClient({
  uri:  process.env.ROCKETRIDE_URI,
  auth: process.env.ROCKETRIDE_API_KEY,
  env:  { ROCKETRIDE_OPENAI_KEY: process.env.ROCKETRIDE_OPENAI_KEY ?? "" },
});

const PIPE_PATH = join(process.cwd(), "scrape-edgar.pipe");
let scrapeToken: string | null = null;

async function getScrapeToken(): Promise<string> {
  if (!scrapeToken) {
    await rrClient.connect();
    const { token } = await rrClient.use({
      filepath: PIPE_PATH,
      token: "scrape-transcripts-v1",
      ttl: 3600,
      useExisting: true,
    });
    scrapeToken = token;
  }
  return scrapeToken;
}

// ── Finnhub helpers ───────────────────────────────────────────────────────────

async function sleep(ms: number) {
  return new Promise(res => setTimeout(res, ms));
}

async function finnhubFetch(path: string): Promise<unknown> {
  await sleep(FINNHUB_DELAY_MS);
  const key = process.env.FINNHUB_API_KEY;
  if (!key) throw new Error("FINNHUB_API_KEY not set in .env.local");

  const url = `https://finnhub.io/api/v1${path}&token=${key}`;
  const res  = await fetch(url);
  if (!res.ok) throw new Error(`Finnhub fetch failed: ${res.status} ${path}`);
  return res.json();
}

/** Get the ID of the most recent earnings call transcript for a ticker */
async function getLatestTranscriptId(ticker: string): Promise<string> {
  const data = await finnhubFetch(`/stock/transcripts/list?symbol=${ticker}`) as {
    transcripts?: FinnhubTranscriptListItem[]
  };
  const list = data.transcripts;
  if (!list || list.length === 0) throw new Error(`No transcripts found for ${ticker}`);
  // List is newest-first
  return list[0].id;
}

/** Fetch a transcript and convert speaker segments to plain text */
async function getTranscriptText(transcriptId: string): Promise<{ text: string; quarter: string }> {
  const data = await finnhubFetch(`/stock/transcripts?id=${transcriptId}`) as FinnhubTranscript;

  if (!data.transcript || data.transcript.length === 0) {
    throw new Error(`Transcript ${transcriptId} has no content`);
  }

  // Convert speaker segments to readable text, preserving speaker labels
  // because "Analyst: Can you break out Apple revenue?" is very valuable context
  const lines: string[] = [];
  for (const seg of data.transcript) {
    if (seg.speech && seg.speech.length > 0) {
      lines.push(`[${seg.name}]`);
      lines.push(seg.speech.join(" "));
    }
  }

  return {
    text: lines.join("\n"),
    quarter: `Q${data.quarter} ${data.year}`,
  };
}

// ── RocketRide extraction ─────────────────────────────────────────────────────

async function extractRelationships(
  ticker: string,
  quarter: string,
  transcript: string,
): Promise<Relationship[]> {
  const token = await getScrapeToken();

  // Transcripts can be very long — take the most relevant portion.
  // The Q&A section (second half) is richest for named customer mentions.
  // We take up to 12k chars, biased toward the end where Q&A lives.
  const MAX_CHARS = 12000;
  const text = transcript.length > MAX_CHARS
    ? transcript.slice(0, 4000) + "\n\n---\n\n" + transcript.slice(-8000)
    : transcript;

  if (DEBUG) {
    console.log(`\n  ── transcript sample (first 400 chars) ──`);
    console.log(text.slice(0, 400).replace(/\n/g, " "));
    console.log(`  ─────────────────────────────────────────\n`);
  }

  const question = new Question({ expectJson: true });
  question.addInstruction(
    "Role",
    `You are extracting supply-chain relationships from a ${quarter} earnings call transcript for ${ticker}.`
  );
  question.addInstruction(
    "Task",
    "Find every place where a specific company is named as a customer, supplier, or partner. " +
    "Earnings calls are conversational — look for phrases like 'our Apple program', " +
    "'TSMC remains our largest customer', 'we supply Boeing with', 'Amazon accounted for X%'. " +
    "Only extract relationships where a real company name is explicitly stated."
  );
  question.addInstruction(
    "Types",
    "CUSTOMER_OF = fromCompany buys from / is served by toCompany. " +
    "SUPPLIES_TO = fromCompany sells to / supplies toCompany."
  );
  question.addInstruction(
    "Names",
    `Normalise all company names to short well-known forms (e.g. "Apple" not "Apple Inc.", ` +
    `"Nvidia" not "NVIDIA Corporation"). Refer to ${ticker} by its common name.`
  );
  question.addExample(
    "Skyworks Q2 2025 call: 'Apple represented approximately 59% of our revenue this quarter'",
    [{ fromCompany: "Skyworks", toCompany: "Apple", type: "SUPPLIES_TO", weightPct: 0.59 }]
  );
  question.addExample(
    "Lam Research Q1 2025 call: 'TSMC and Samsung together accounted for roughly half our systems revenue'",
    [
      { fromCompany: "Lam Research", toCompany: "TSMC",    type: "SUPPLIES_TO", weightPct: null },
      { fromCompany: "Lam Research", toCompany: "Samsung", type: "SUPPLIES_TO", weightPct: null },
    ]
  );
  question.addContext(text);
  question.addQuestion(
    `Extract all named supply-chain relationships from this ${ticker} ${quarter} earnings call. ` +
    "Return a JSON array. Return [] if no specific company names are mentioned."
  );

  const response = await rrClient.chat({ token, question });
  const result   = response.answers?.[0];
  if (!result) return [];
  return Array.isArray(result) ? (result as Relationship[]) : [];
}

// ── Neo4j writes ──────────────────────────────────────────────────────────────

async function upsertCompany(name: string) {
  await runQuery("MERGE (c:Company {name: $name})", { name });
}

async function upsertRelationship(rel: Relationship, source: string) {
  const weight = rel.weightPct ?? 0.1;
  await runQuery(
    `MATCH (a:Company {name: $from})
     MATCH (b:Company {name: $to})
     MERGE (a)-[r:${rel.type}]->(b)
     SET r.weight = $weight, r.source = $source`,
    { from: rel.fromCompany, to: rel.toCompany, weight, source }
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function processTicker(ticker: string) {
  console.log(`\n── ${ticker} ────────────────────────`);

  const transcriptId      = await getLatestTranscriptId(ticker);
  const { text, quarter } = await getTranscriptText(transcriptId);
  console.log(`  ${quarter} transcript: ${(text.length / 1000).toFixed(0)}k chars`);

  const relationships = await extractRelationships(ticker, quarter, text);
  console.log(`  Extracted ${relationships.length} relationships`);

  if (relationships.length === 0) return;

  const allCompanies = [...new Set(relationships.flatMap(r => [r.fromCompany, r.toCompany]))];
  for (const name of allCompanies) await upsertCompany(name);

  const source = `finnhub-transcript-${quarter.replace(" ", "-").toLowerCase()}`;
  for (const rel of relationships) {
    await upsertRelationship(rel, source);
    const w = rel.weightPct ? ` weight=${rel.weightPct}` : "";
    console.log(`  ✓ (${rel.fromCompany}) -[${rel.type}]-> (${rel.toCompany})${w}`);
  }
}

async function main() {
  console.log("Starting transcript scrape…\n");

  for (const ticker of TICKERS) {
    try {
      await processTicker(ticker);
    } catch (err) {
      console.error(`  ✗ ${ticker}: ${(err as Error).message}`);
    }
  }

  console.log("\nDone.");
  if (scrapeToken) await rrClient.terminate(scrapeToken).catch(() => {});
  await rrClient.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
