/**
 * scrape-edgar.ts
 *
 * Scrapes SEC EDGAR 10-K filings for major customer / supplier disclosures
 * and writes the extracted relationships into Neo4j.
 *
 * Uses RocketRide for all LLM calls (relationship extraction + entity normalisation).
 *
 * Usage:
 *   npx tsx scripts/scrape-edgar.ts
 *
 * Prerequisites:
 *   Set ROCKETRIDE_URI / ROCKETRIDE_API_KEY / ROCKETRIDE_OPENAI_KEY in .env.local
 *   Set NEO4J_URI / NEO4J_USER / NEO4J_PASSWORD in .env.local
 *
 * EDGAR rate limit: 10 req/s — this script stays well under that.
 * EDGAR requires a descriptive User-Agent with a contact email.
 */

import { config } from "dotenv";
import { resolve, join } from "path";
config({ path: resolve(__dirname, "../.env.local") });

import { RocketRideClient, Question } from "rocketride";
import { runQuery } from "../lib/neo4j";

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
      token: "scrape-edgar-v1",
      ttl: 3600,
      useExisting: true,
    });
    scrapeToken = token;
  }
  return scrapeToken;
}

// ── Canonical name overrides ──────────────────────────────────────────────────
// Deterministic fallbacks applied AFTER LLM normalisation.
// Keys are lowercased substrings; values are canonical names.

const CANONICAL_SUBSTRINGS: Array<[string, string]> = [
  ["taiwan semiconductor manufacturing", "TSMC"],
  ["tsmc", "TSMC"],
  ["samsung electronics", "Samsung"],
  ["samsung", "Samsung"],
  ["apple inc", "Apple"],
  ["apple", "Apple"],
  ["qualcomm", "Qualcomm"],
  ["nvidia corporation", "Nvidia"],
  ["nvidia", "Nvidia"],
  ["intel corporation", "Intel"],
  ["intel", "Intel"],
  ["microsoft corporation", "Microsoft"],
  ["microsoft", "Microsoft"],
  ["amazon.com", "Amazon"],
  ["amazon", "Amazon"],
  ["alphabet", "Google"],
  ["google", "Google"],
  ["meta platforms", "Meta"],
  ["boeing company", "Boeing"],
  ["boeing", "Boeing"],
  ["airbus", "Airbus"],
  ["raytheon", "Raytheon"],
  ["rtx corporation", "RTX"],
  ["rtx", "RTX"],
  ["general motors", "GM"],
  ["ford motor", "Ford"],
  ["ford", "Ford"],
  ["stellantis", "Stellantis"],
  ["lockheed martin", "Lockheed Martin"],
  ["northrop grumman", "Northrop Grumman"],
  ["general electric", "GE"],
  ["ge aerospace", "GE Aerospace"],
  ["huawei", "Huawei"],
  ["sk hynix", "SK Hynix"],
  ["micron technology", "Micron"],
  ["micron", "Micron"],
  ["broadcom", "Broadcom"],
  ["texas instruments", "Texas Instruments"],
  ["ibm corporation", "IBM"],
  ["ibm", "IBM"],
  ["dell technologies", "Dell"],
  ["dell", "Dell"],
  ["hewlett-packard enterprise", "HPE"],
  ["hewlett packard enterprise", "HPE"],
  ["applied materials", "Applied Materials"],
  ["honeywell", "Honeywell"],
  ["ciena", "Ciena"],
  ["volkswagen", "Volkswagen"],
  ["globalfoundries", "GlobalFoundries"],
  ["geely", "Geely"],
  ["toyota", "Toyota"],
  ["byd", "BYD"],
  ["lam research", "Lam Research"],
  // Tesla
  ["tesla, inc", "Tesla"],
  ["tesla inc", "Tesla"],
  ["tesla motors", "Tesla"],
  ["tesla", "Tesla"],
  // ON Semiconductor
  ["on semiconductor", "ON Semiconductor"],
  ["onsemi", "ON Semiconductor"],
  // Wolfspeed
  ["wolfspeed", "Wolfspeed"],
  ["wolfspeed, inc", "Wolfspeed"],
  // Monolithic Power
  ["monolithic power systems", "Monolithic Power"],
  ["monolithic power", "Monolithic Power"],
  // Albemarle
  ["albemarle", "Albemarle"],
  ["albemarle corporation", "Albemarle"],
  // TE Connectivity
  ["te connectivity", "TE Connectivity"],
  ["te connectivity ltd", "TE Connectivity"],
  // NXP Semiconductors
  ["nxp semiconductors", "NXP Semiconductors"],
  ["nxp semiconductors nv", "NXP Semiconductors"],
  ["nxp", "NXP Semiconductors"],
  // Super Micro
  ["super micro computer", "Super Micro"],
  ["supermicro", "Super Micro"],
  // Arista Networks
  ["arista networks", "Arista Networks"],
  ["arista networks, inc", "Arista Networks"],
  // Hexcel
  ["hexcel", "Hexcel"],
  ["hexcel corporation", "Hexcel"],
  // Spirit AeroSystems
  ["spirit aerosystems", "Spirit AeroSystems"],
  // Triumph Group
  ["triumph group", "Triumph Group"],
  ["triumph group, inc", "Triumph Group"],
  // Microchip Technology
  ["microchip technology", "Microchip Technology"],
  ["microchip technology incorporated", "Microchip Technology"],
  // Analog Devices
  ["analog devices", "Analog Devices"],
  ["analog devices, inc", "Analog Devices"],
  ["analog devices inc", "Analog Devices"],
  // Marvell Technology
  ["marvell technology", "Marvell Technology"],
  ["marvell technology, inc", "Marvell Technology"],
  ["marvell", "Marvell Technology"],
  // Microsoft
  ["microsoft corporation", "Microsoft"],
  ["microsoft corp", "Microsoft"],
  ["microsoft", "Microsoft"],
  // BMW
  ["bmw", "BMW"],
  ["bayerische motoren werke", "BMW"],
  ["bmw ag", "BMW"],
  // Ford
  ["ford motor company", "Ford"],
];

function applyCanonical(name: string): string {
  const lower = name.toLowerCase();
  for (const [sub, canonical] of CANONICAL_SUBSTRINGS) {
    if (lower.includes(sub)) return canonical;
  }
  return name;
}

// ── Config ────────────────────────────────────────────────────────────────────

const TICKERS = [
  // Apple component suppliers — very high concentration, almost always name Apple
  "CRUS",  // Cirrus Logic      ~89% Apple
  "SWKS",  // Skyworks          ~59% Apple (RF chips)
  "QRVO",  // Qorvo             ~47% Apple (RF chips)
  "JBL",   // Jabil             contract manufacturer, Apple exposure
  "AMKR",  // Amkor Technology  chip packaging, names Apple & Qualcomm

  // Semiconductor equipment — routinely name TSMC, Samsung, Intel
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

  // Contract electronics
  "FLEX",  // Flex Ltd
  "CLS",   // Celestica

  // ── NEW: Tesla / EV ecosystem ──────────────────────────────────────────────
  "TSLA",  // Tesla itself — try for supplier names
  "WOLF",  // Wolfspeed        SiC wafers for Tesla (Gigafactory supply agreement)
  "ON",    // ON Semiconductor SiC modules, names Tesla/Ford/GM
  "MPWR",  // Monolithic Power power mgmt ICs, names Tesla & Nvidia
  "ALB",   // Albemarle        lithium, names Tesla & GM battery contracts
  "TEL",   // TE Connectivity  connectors & sensors, names Tesla/Ford/GM
  "NXPI",  // NXP Semiconductors auto MCUs, names Ford/BMW/Tesla (20-F)

  // ── NEW: Cloud / hyperscaler suppliers ────────────────────────────────────
  "SMCI",  // Super Micro Computer  server ODM, names Microsoft/Google/Meta/Amazon
  "ANET",  // Arista Networks       data-center networking, names Microsoft/Meta/Google

  // ── NEW: Aerospace additions ───────────────────────────────────────────────
  "HXL",   // Hexcel            carbon-fiber composites, names Boeing & Airbus
  "SPR",   // Spirit AeroSystems already in DB as node; scrape for upstream suppliers
  "TGI",   // Triumph Group     aerostructures, names Boeing & Airbus

  // ── NEW: Broader semiconductor / automotive ────────────────────────────────
  "MCHP",  // Microchip Technology MCUs, names OEMs
  "ADI",   // Analog Devices    mixed-signal, names auto/industrial OEMs
  "MRVL",  // Marvell Technology networking ASICs, names cloud customers
];

const USER_AGENT     = "tremor-scraper contact@example.com";
const EDGAR_DELAY_MS = 200;
const DEBUG          = process.argv.includes("--debug");
// When set, only process tickers listed (comma-separated), e.g. --only=CRUS,SWKS
const ONLY_TICKERS   = (() => {
  const flag = process.argv.find(a => a.startsWith("--only="));
  return flag ? flag.slice(7).split(",").map(s => s.trim().toUpperCase()) : null;
})();

// ── Types ─────────────────────────────────────────────────────────────────────

interface Relationship {
  fromCompany: string;
  toCompany:   string;
  type:        "CUSTOMER_OF" | "SUPPLIES_TO";
  weightPct:   number | null;
}

// ── EDGAR helpers ─────────────────────────────────────────────────────────────

async function sleep(ms: number) {
  return new Promise(res => setTimeout(res, ms));
}

async function edgarFetch(url: string): Promise<string> {
  await sleep(EDGAR_DELAY_MS);
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, "Accept-Encoding": "gzip, deflate" },
  });
  if (!res.ok) throw new Error(`EDGAR fetch failed: ${res.status} ${url}`);
  return res.text();
}

async function tickerToCIK(ticker: string): Promise<string> {
  const raw = await edgarFetch("https://www.sec.gov/files/company_tickers.json");
  const data: Record<string, { cik_str: number; ticker: string }> = JSON.parse(raw);
  for (const entry of Object.values(data)) {
    if (entry.ticker.toUpperCase() === ticker.toUpperCase()) {
      return String(entry.cik_str).padStart(10, "0");
    }
  }
  throw new Error(`CIK not found for ticker: ${ticker}`);
}

// Annual report form types — 10-K for US companies, 20-F for foreign private issuers (ASML, TSM)
const ANNUAL_FORMS = new Set(["10-K", "20-F"]);

async function getLatestAnnualFiling(cik: string): Promise<{ accession: string; primaryDoc: string }> {
  const raw  = await edgarFetch(`https://data.sec.gov/submissions/CIK${cik}.json`);
  const data = JSON.parse(raw);
  // submissions JSON already includes primaryDocument — no separate index fetch needed
  const filings = data.filings?.recent as {
    form: string[];
    accessionNumber: string[];
    primaryDocument: string[];
  } | undefined;
  if (!filings) throw new Error(`No filings for CIK ${cik}`);
  for (let i = 0; i < filings.form.length; i++) {
    if (ANNUAL_FORMS.has(filings.form[i])) {
      return { accession: filings.accessionNumber[i], primaryDoc: filings.primaryDocument[i] };
    }
  }
  throw new Error(`No 10-K or 20-F found for CIK ${cik}`);
}

async function getFilingText(cik: string, accession: string, primaryDoc: string): Promise<string> {
  const acc    = accession.replace(/-/g, "");
  const docUrl = `https://www.sec.gov/Archives/edgar/data/${parseInt(cik)}/${acc}/${primaryDoc}`;
  return stripHtml(await edgarFetch(docUrl));
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s{2,}/g, " ")
    .trim();
}

// Phrases that indicate a false-positive match (tax, earnings, geographic content)
const FALSE_POSITIVE = [
  /effective tax rate/i, /income tax/i, /net income per share/i,
  /earnings per share/i, /long-term debt/i, /interest expense/i,
  /foreign exchange/i, /operating lease/i, /fair value/i,
  /international segment/i, /geographic/i,
];

// Phrases that indicate pure risk-factor boilerplate (no actual customer names)
const RISK_FACTOR_ONLY = [
  /could have a material adverse effect/i,
  /may adversely affect our/i,
  /inability to maintain or increase sales/i,
  /we may not be able to maintain/i,
];

function isFalsePositive(window: string): boolean {
  return FALSE_POSITIVE.some(re => re.test(window.slice(0, 600)));
}

function isRiskFactorOnly(window: string): boolean {
  // A window is "risk factor only" if it has risk language but no actual
  // named-company percentage disclosure — i.e. no "CompanyName … X%/percent"
  const hasConcreteDisclosure = /[A-Z][A-Za-z][\w\s,.'&-]{1,40}(?:Inc\.|Corp\.|LLC|Co\.|Ltd\.)?[\s,]+(?:accounted for|represented)[^.]{0,80}(?:\d{1,3}\s*(?:%|percent)|approximately)/i.test(window.slice(0, 1200));
  return !hasConcreteDisclosure && RISK_FACTOR_ONLY.some(re => re.test(window.slice(0, 1200)));
}

function extractCustomerSection(text: string): string {
  const WINDOW   = 2500;
  const BACK     = 400;   // chars to include before a hit
  const MAX_HITS = 6;
  const hits: number[] = [];

  function wouldOverlap(idx: number): boolean {
    // A hit at idx would be covered by window [h - BACK, h + WINDOW] for existing h
    return hits.some(h => idx >= h - BACK && idx <= h + WINDOW);
  }

  function addHit(idx: number, windowText?: string): boolean {
    if (wouldOverlap(idx)) return false;
    if (windowText && isFalsePositive(windowText)) return false;
    if (windowText && isRiskFactorOnly(windowText)) return false;
    hits.push(idx);
    return true;
  }

  // ── Tier 1: explicit section headers (most reliable) ──────────────────────
  // These headers directly introduce named-customer disclosures in 10-Ks.
  // ORDER MATTERS: most specific / highest-signal patterns first so they claim
  // slots before the broader patterns (e.g. "Significant Account") can fill them
  // with unrelated financial-statement sections.
  const headers = [
    /Revenue Concentrations? (and )?Significant Customers?/gi,
    /Customer Concentration/gi,
    /Concentration of Revenue/gi,
    /Major Customers?\b/gi,
    /\bCustomers\b\s{0,3}\n/g,          // "Customers" as a standalone section header
    /Significant Customers?\b/gi,        // more specific than "Significant Accounts"
    /Significant Accounts?\b(?!.*accounting)/gi, // but not "Significant Accounting Policies"
  ];
  for (const re of headers) {
    for (const m of text.matchAll(re)) {
      if (hits.length >= MAX_HITS) break;
      const w = text.slice(Math.max(0, m.index! - 400), Math.min(text.length, m.index! + WINDOW));
      addHit(m.index!, w);
    }
  }

  // ── Tier 2: "[Company Name] accounted for X%" pattern ─────────────────────
  // This directly names a company — exactly what we want to extract.
  if (hits.length < MAX_HITS) {
    const namedPct = /[A-Z][A-Za-z][\w\s,.'&-]{2,40}(?:Inc\.|Corp\.|LLC|Co\.|Ltd\.)?[\s,]+accounted for (approximately )?\d{1,3}(\.\d)?\s*%/g;
    for (const m of text.matchAll(namedPct)) {
      if (hits.length >= MAX_HITS) break;
      const w = text.slice(Math.max(0, m.index! - 300), Math.min(text.length, m.index! + WINDOW));
      addHit(m.index!, w);
    }
  }

  // ── Tier 3: plain percentage-near-revenue patterns, with false-positive guard
  if (hits.length < MAX_HITS) {
    const pct = `(?:approximately )?\\d{1,3}(?:\\.\\d)?\\s*(?:%|percent)`;
    const rev = `(?:net |total )?(?:revenue|net sales)`;
    const pctRevenue = [
      new RegExp(`accounted for ${pct}[^.]{0,60}of ${rev}`, "gi"),
      new RegExp(`represented ${pct}[^.]{0,60}of ${rev}`, "gi"),
      new RegExp(`represented ${pct}[^.]{0,120}(?:net sales|revenue)`, "gi"),
    ];
    for (const re of pctRevenue) {
      for (const m of text.matchAll(re)) {
        if (hits.length >= MAX_HITS) break;
        const w = text.slice(Math.max(0, m.index! - 300), Math.min(text.length, m.index! + WINDOW));
        addHit(m.index!, w);
      }
    }
  }

  // ── Tier 4: look for explicit "Apple", "iPhone" brand mentions near revenue
  // Many Apple suppliers anonymize their SEC filings ("one customer") but still
  // mention Apple/iPhone/iOS elsewhere in the same section — this catches that.
  if (hits.length < MAX_HITS) {
    const brandMentions = [
      /\bApple\b[^.]{0,200}(?:revenue|sales|customer)/gi,
      /\biPhone\b[^.]{0,200}(?:revenue|sales|customer)/gi,
      /\bTSMC\b[^.]{0,200}(?:revenue|sales|supplier|manufacture)/gi,
      /\bBoeing\b[^.]{0,200}(?:revenue|sales|customer|program)/gi,
    ];
    for (const re of brandMentions) {
      for (const m of text.matchAll(re)) {
        if (hits.length >= MAX_HITS) break;
        const w = text.slice(Math.max(0, m.index! - 200), Math.min(text.length, m.index! + WINDOW));
        addHit(m.index!, w);
      }
    }
  }

  if (hits.length === 0) return "";

  const combined = hits
    .sort((a, b) => a - b)
    .map(idx => text.slice(Math.max(0, idx - 400), Math.min(text.length, idx + WINDOW)))
    .join("\n\n---\n\n")
    .slice(0, 10000);

  if (DEBUG) {
    console.log("\n  ── section text (first 600 chars) ──");
    console.log(combined.slice(0, 600).replace(/\n/g, " "));
    console.log("  ────────────────────────────────────\n");
  }

  return combined;
}

// ── RocketRide LLM calls ──────────────────────────────────────────────────────

async function extractRelationships(
  filingCompany: string,
  section: string,
): Promise<Relationship[]> {
  if (!section.trim()) {
    console.log(`  ⚠  No customer section found for ${filingCompany}`);
    return [];
  }

  const token = await getScrapeToken();

  const question = new Question({ expectJson: true });
  question.addInstruction(
    "Role",
    `You are extracting supply-chain relationships from an SEC annual filing. The filing company is ${filingCompany} (ticker: ${filingCompany}). Refer to the filing company by its common short name (e.g. "Qualcomm" not "QUALCOMM Incorporated", "Nvidia" not "NVIDIA Corporation").`
  );
  question.addInstruction(
    "Task",
    "Extract every company mentioned as a major customer of the filing company OR a major supplier it depends on. Only include relationships where a specific company name is stated (not vague phrases like 'one customer')."
  );
  question.addInstruction(
    "Types",
    "CUSTOMER_OF = fromCompany buys from toCompany. SUPPLIES_TO = fromCompany sells to toCompany."
  );
  question.addExample(
    "Apple 10-K: 'TSMC manufactures substantially all of our chips'",
    [
      { fromCompany: "Apple", toCompany: "TSMC", type: "CUSTOMER_OF", weightPct: null }
    ]
  );
  question.addExample(
    "TSMC 10-K: 'Apple accounted for 25% of our revenue'",
    [
      { fromCompany: "TSMC", toCompany: "Apple", type: "SUPPLIES_TO", weightPct: 0.25 }
    ]
  );
  question.addContext(section);
  question.addQuestion(
    `Extract supply-chain relationships from this ${filingCompany} 10-K excerpt. Return a JSON array of relationship objects.`
  );

  const response = await rrClient.chat({ token, question });

  const result = response.answers?.[0];
  if (!result) return [];
  // expectJson: true means answers[0] is already parsed.
  // LLM sometimes wraps in {"relationships": [...]} — unwrap if needed.
  if (Array.isArray(result)) return result as Relationship[];
  if (typeof result === "object" && result !== null) {
    for (const v of Object.values(result as Record<string, unknown>)) {
      if (Array.isArray(v)) return v as Relationship[];
    }
  }
  return [];
}

async function normaliseNames(names: string[]): Promise<Record<string, string>> {
  if (names.length === 0) return {};

  const token = await getScrapeToken();

  const question = new Question({ expectJson: true });
  question.addInstruction("Task", "Normalise company names to their well-known short public names.");
  question.addInstruction("Rules", "Use the shortest widely-recognised form: 'Apple' not 'Apple Inc.', 'TSMC' not 'Taiwan Semiconductor Manufacturing Company', 'Samsung' not 'Samsung Electronics Company, Ltd.', 'Boeing' not 'The Boeing Company', 'GM' not 'General Motors Company', 'Nvidia' not 'NVIDIA Corporation', 'RTX' not 'RTX Corporation'.");
  question.addExample(
    "Input names",
    {
      "Apple Inc.": "Apple",
      "NVIDIA Corporation": "Nvidia",
      "Taiwan Semiconductor Manufacturing Company": "TSMC",
      "Samsung Electronics Company, Ltd.": "Samsung",
      "The Boeing Company": "Boeing",
      "General Motors Company": "GM",
      "RTX Corporation": "RTX",
      "Qualcomm Incorporated": "Qualcomm",
    }
  );
  question.addContext({ names });
  question.addQuestion("Return a JSON object mapping each input name to its canonical short form.");

  const response = await rrClient.chat({ token, question });

  const result = response.answers?.[0];
  const llmMap: Record<string, string> = (!result || typeof result !== "object" || Array.isArray(result))
    ? {}
    : (result as Record<string, string>);

  // Apply deterministic canonical overrides on top of (or instead of) LLM results
  const out: Record<string, string> = {};
  for (const name of names) {
    const llmResult = llmMap[name] ?? name;
    out[name] = applyCanonical(llmResult);
  }
  return out;
}

// ── Neo4j writes ──────────────────────────────────────────────────────────────

async function upsertCompany(name: string) {
  await runQuery("MERGE (c:Company {name: $name})", { name });
}

async function upsertRelationship(rel: Relationship) {
  const weight = rel.weightPct ?? 0.1;
  await runQuery(
    `MATCH (a:Company {name: $from})
     MATCH (b:Company {name: $to})
     MERGE (a)-[r:${rel.type}]->(b)
     SET r.weight = $weight, r.source = 'edgar'`,
    { from: rel.fromCompany, to: rel.toCompany, weight }
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function processTicker(ticker: string) {
  console.log(`\n── ${ticker} ────────────────────────`);

  const cik = await tickerToCIK(ticker);
  console.log(`  CIK: ${cik}`);

  const { accession, primaryDoc } = await getLatestAnnualFiling(cik);
  console.log(`  Latest annual filing: ${accession} (${primaryDoc})`);

  const text = await getFilingText(cik, accession, primaryDoc);
  console.log(`  Filing text: ${(text.length / 1000).toFixed(0)}k chars`);

  const section   = extractCustomerSection(text);
  console.log(`  Customer section: ${section.length} chars`);

  const relationships = await extractRelationships(ticker, section);
  console.log(`  Extracted ${relationships.length} relationships`);
  if (relationships.length === 0) return;

  // Normalise company names in one batch
  const rawNames = [...new Set(relationships.flatMap(r => [r.fromCompany, r.toCompany]))];
  const nameMap  = await normaliseNames(rawNames);
  const normalised = relationships.map(r => ({
    ...r,
    fromCompany: nameMap[r.fromCompany] ?? r.fromCompany,
    toCompany:   nameMap[r.toCompany]   ?? r.toCompany,
  }));

  // Write to Neo4j
  const allCompanies = [...new Set(normalised.flatMap(r => [r.fromCompany, r.toCompany]))];
  for (const name of allCompanies) await upsertCompany(name);
  for (const rel of normalised) {
    await upsertRelationship(rel);
    const w = rel.weightPct ? ` weight=${rel.weightPct}` : "";
    console.log(`  ✓ (${rel.fromCompany}) -[${rel.type}]-> (${rel.toCompany})${w}`);
  }
}

async function main() {
  const tickers = ONLY_TICKERS ? TICKERS.filter(t => ONLY_TICKERS.includes(t)) : TICKERS;
  console.log(`Starting EDGAR scrape… (${tickers.length} tickers)\n`);

  for (const ticker of tickers) {
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
