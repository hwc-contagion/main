/**
 * Seed script: populates Neo4j with Company nodes and weighted supply-chain relationships.
 * Run with: npx ts-node scripts/seed.ts
 */

import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../.env.local") });

import { runQuery } from "../lib/neo4j";

// ─── Company nodes ────────────────────────────────────────────────────────────

const companies = [
  "Apple",
  "TSMC",
  "ASML",
  "Qualcomm",
  "Broadcom",
  "Samsung",
  "Boeing",
  "Spirit AeroSystems",
  "Amazon",
  "UPS",
  "FedEx",
  "Ford",
  "GM",
  "LG Energy Solution",
  "Nvidia",
];

// ─── Relationships ────────────────────────────────────────────────────────────
//
// weight = revenue dependency of the *source* node on this relationship.
//
// SUPPLIES_TO  – fraction of the supplier's total revenue that comes from this customer
// CUSTOMER_OF  – fraction of the customer's procurement/spend directed at this supplier
// CREDITOR_OF  – relative significance of the credit exposure (0–1 scale)

type RelType = "SUPPLIES_TO" | "CUSTOMER_OF" | "CREDITOR_OF";

interface Relationship {
  from: string;
  to: string;
  type: RelType;
  weight: number;
}

const relationships: Relationship[] = [
  // ── Semiconductor equipment ──────────────────────────────────────────────
  // ASML sells EUV/DUV tools; TSMC ~35 % of ASML revenue, Samsung ~20 %
  { from: "ASML",    to: "TSMC",    type: "SUPPLIES_TO", weight: 0.35 },
  { from: "ASML",    to: "Samsung", type: "SUPPLIES_TO", weight: 0.20 },

  // ── TSMC foundry customers ───────────────────────────────────────────────
  // Apple ~25 %, Nvidia ~11 %, Qualcomm ~5 %, Broadcom ~5 % of TSMC revenue
  { from: "TSMC", to: "Apple",    type: "SUPPLIES_TO", weight: 0.25 },
  { from: "TSMC", to: "Nvidia",   type: "SUPPLIES_TO", weight: 0.11 },
  { from: "TSMC", to: "Qualcomm", type: "SUPPLIES_TO", weight: 0.05 },
  { from: "TSMC", to: "Broadcom", type: "SUPPLIES_TO", weight: 0.05 },

  // ── Samsung → Apple (OLED panels, NAND) ─────────────────────────────────
  { from: "Samsung", to: "Apple", type: "SUPPLIES_TO", weight: 0.08 },

  // ── Qualcomm → Apple (modem/RF chips, ~18 % of Qualcomm revenue) ─────────
  { from: "Qualcomm", to: "Apple", type: "SUPPLIES_TO", weight: 0.18 },

  // ── Broadcom → Apple (Wi-Fi/BT/custom ASICs, ~20 % of Broadcom revenue) ──
  { from: "Broadcom", to: "Apple", type: "SUPPLIES_TO", weight: 0.20 },

  // ── Nvidia → Amazon (AWS GPU procurement) ───────────────────────────────
  { from: "Nvidia", to: "Amazon", type: "SUPPLIES_TO", weight: 0.08 },

  // ── Aerospace ────────────────────────────────────────────────────────────
  // Boeing is ~85 % of Spirit's revenue (737/787 fuselages)
  { from: "Spirit AeroSystems", to: "Boeing",  type: "SUPPLIES_TO", weight: 0.85 },
  // Boeing supplies freighter aircraft to Amazon Air
  { from: "Boeing",             to: "Amazon",  type: "SUPPLIES_TO", weight: 0.04 },

  // ── Logistics ────────────────────────────────────────────────────────────
  // Amazon represents ~13 % of UPS package volume / revenue
  { from: "UPS",   to: "Amazon", type: "SUPPLIES_TO", weight: 0.13 },
  { from: "FedEx", to: "Amazon", type: "SUPPLIES_TO", weight: 0.05 },
  // Parcel delivery for Ford & GM dealer/parts networks
  { from: "UPS",   to: "Ford",   type: "SUPPLIES_TO", weight: 0.02 },
  { from: "UPS",   to: "GM",     type: "SUPPLIES_TO", weight: 0.02 },
  { from: "FedEx", to: "Ford",   type: "SUPPLIES_TO", weight: 0.02 },
  { from: "FedEx", to: "GM",     type: "SUPPLIES_TO", weight: 0.01 },

  // ── EV battery supply chain ───────────────────────────────────────────────
  // GM is ~18 % of LG Energy Solution revenue (Ultium Cells JV)
  { from: "LG Energy Solution", to: "GM",   type: "SUPPLIES_TO", weight: 0.18 },
  // Ford is ~12 % of LG Energy Solution revenue (BlueOval SK JV)
  { from: "LG Energy Solution", to: "Ford", type: "SUPPLIES_TO", weight: 0.12 },

  // ── CUSTOMER_OF ──────────────────────────────────────────────────────────
  // Apple sources ~90 % of its chips from TSMC
  { from: "Apple",    to: "TSMC",               type: "CUSTOMER_OF", weight: 0.90 },
  { from: "Apple",    to: "Qualcomm",           type: "CUSTOMER_OF", weight: 0.05 },
  { from: "Apple",    to: "Broadcom",           type: "CUSTOMER_OF", weight: 0.04 },
  { from: "Apple",    to: "Samsung",            type: "CUSTOMER_OF", weight: 0.06 },
  // Nvidia is ~95 % TSMC-dependent for cutting-edge nodes
  { from: "Nvidia",   to: "TSMC",               type: "CUSTOMER_OF", weight: 0.95 },
  // Qualcomm splits between TSMC and Samsung; ~60 % at TSMC
  { from: "Qualcomm", to: "TSMC",               type: "CUSTOMER_OF", weight: 0.60 },
  { from: "Qualcomm", to: "Samsung",            type: "CUSTOMER_OF", weight: 0.30 },
  // Amazon relies heavily on UPS for small-package delivery
  { from: "Amazon",   to: "UPS",                type: "CUSTOMER_OF", weight: 0.12 },
  { from: "Amazon",   to: "FedEx",              type: "CUSTOMER_OF", weight: 0.05 },
  // Boeing is the largest customer of Spirit's fuselage production
  { from: "Boeing",   to: "Spirit AeroSystems", type: "CUSTOMER_OF", weight: 0.55 },
  // Ford's EV battery sourcing
  { from: "Ford",     to: "LG Energy Solution", type: "CUSTOMER_OF", weight: 0.15 },
  // GM's EV battery sourcing (Ultium)
  { from: "GM",       to: "LG Energy Solution", type: "CUSTOMER_OF", weight: 0.20 },
  // TSMC capacity depends on ASML EUV tools
  { from: "TSMC",     to: "ASML",               type: "CUSTOMER_OF", weight: 0.40 },

  // ── CREDITOR_OF ───────────────────────────────────────────────────────────
  // Boeing advanced ~$300 M+ to Spirit to shore up its supplier
  { from: "Boeing", to: "Spirit AeroSystems",   type: "CREDITOR_OF", weight: 0.30 },
  // GM co-financed Ultium Cells JV debt with LG Energy Solution
  { from: "GM",     to: "LG Energy Solution",   type: "CREDITOR_OF", weight: 0.20 },
  // Ford co-financed BlueOval SK battery JV
  { from: "Ford",   to: "LG Energy Solution",   type: "CREDITOR_OF", weight: 0.15 },
  // Apple has prepaid TSMC for multi-year capacity (advance payments act as credit)
  { from: "Apple",  to: "TSMC",                 type: "CREDITOR_OF", weight: 0.10 },
  // Amazon's multi-year volume commitments give UPS credit-like stability
  { from: "Amazon", to: "UPS",                  type: "CREDITOR_OF", weight: 0.08 },
];

// ─── Seed logic ───────────────────────────────────────────────────────────────

async function seedCompanies() {
  console.log("Creating Company nodes...");
  for (const name of companies) {
    await runQuery("MERGE (c:Company {name: $name})", { name });
    console.log(`  ✓ ${name}`);
  }
}

async function seedRelationships() {
  console.log("\nCreating relationships...");
  for (const rel of relationships) {
    const query = `
      MATCH (a:Company {name: $from})
      MATCH (b:Company {name: $to})
      MERGE (a)-[r:${rel.type}]->(b)
      SET r.weight = $weight
    `;
    await runQuery(query, { from: rel.from, to: rel.to, weight: rel.weight });
    console.log(`  ✓ (${rel.from}) -[${rel.type} {weight: ${rel.weight}}]-> (${rel.to})`);
  }
}

async function main() {
  console.log("Seeding Neo4j database...\n");
  await seedCompanies();
  await seedRelationships();
  console.log("\nDone.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
