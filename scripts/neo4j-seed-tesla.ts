/**
 * neo4j-seed-tesla.ts
 *
 * Manually seeds well-known Tesla supply chain relationships that cannot be
 * extracted from EDGAR because suppliers anonymize their customers.
 * Sources: public supply agreements, earnings calls, news reports.
 */
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "../.env.local") });

import { runQuery } from "../lib/neo4j";

// Fix direction errors from latest scrape run, then add Tesla data
async function main() {

  // ── 1. Fix HXL (Hexcel): CUSTOMER_OF → SUPPLIES_TO ──────────────────────
  // Hexcel SELLS composite materials TO Boeing, Airbus, Lockheed, etc.
  const hxlRels = await runQuery(`
    MATCH (a:Company {name: 'HXL'})-[r:CUSTOMER_OF]->(b:Company)
    RETURN b.name AS to, r.weight AS w, r.source AS src
  `);
  await runQuery(`MATCH (a:Company {name: 'HXL'})-[r:CUSTOMER_OF]->() DELETE r`);
  for (const rel of hxlRels) {
    await runQuery(`
      MATCH (a:Company {name: 'HXL'}), (b:Company {name: $to})
      MERGE (a)-[r:SUPPLIES_TO]->(b)
      SET r.weight = $w, r.source = $src
    `, { to: rel.to, w: rel.w ?? 0.1, src: rel.src ?? "edgar" });
  }
  // Dedup HXL→Boeing (two entries merged to one)
  await runQuery(`
    MATCH (a:Company {name: 'HXL'})-[r:SUPPLIES_TO]->(b:Company {name: 'Boeing'})
    WITH collect(r) AS rels WHERE size(rels) > 1
    UNWIND rels[1..] AS dup DELETE dup
  `);
  console.log("Fixed HXL: CUSTOMER_OF → SUPPLIES_TO, deduped Boeing");

  // ── 2. Fix ADI: SUPPLIES_TO TSMC → CUSTOMER_OF TSMC ─────────────────────
  // Analog Devices is fabless and BUYS wafer fab from TSMC — it's ADI's supplier
  await runQuery(`
    MATCH (a:Company {name: 'ADI'})-[r:SUPPLIES_TO]->(b:Company {name: 'TSMC'}) DELETE r
  `);
  await runQuery(`
    MATCH (a:Company {name: 'ADI'}), (b:Company {name: 'TSMC'})
    MERGE (a)-[r:CUSTOMER_OF]->(b)
    SET r.weight = 0.5, r.source = 'edgar'
  `);
  console.log("Fixed ADI: SUPPLIES_TO TSMC → CUSTOMER_OF TSMC (ADI is fabless, buys from TSMC)");

  // ── 3. Seed Tesla supply chain ────────────────────────────────────────────
  // WOLF and ON have public multi-billion dollar supply agreements with Tesla.
  // NXP supplies automotive MCUs. Panasonic operates the Nevada Gigafactory.
  // CATL/Samsung SDI supply battery cells. None of these name Tesla in 10-Ks.

  const teslaSuppliers: Array<{ name: string; type: "SUPPLIES_TO"; weight: number; note: string }> = [
    // SiC power semiconductors — critical for EV drivetrain efficiency
    { name: "Wolfspeed",        type: "SUPPLIES_TO", weight: 0.12, note: "$2B 10-year SiC wafer supply agreement (2022)" },
    { name: "ON Semiconductor", type: "SUPPLIES_TO", weight: 0.10, note: "SiC MOSFET modules for Model 3/Y/S/X inverters" },
    // Batteries — Tesla's largest supply cost
    { name: "Panasonic",        type: "SUPPLIES_TO", weight: 0.20, note: "2170/4680 cylindrical cells, Gigafactory Nevada JV" },
    { name: "CATL",             type: "SUPPLIES_TO", weight: 0.15, note: "LFP cells for Model 3/Y standard range (global)" },
    { name: "Samsung SDI",      type: "SUPPLIES_TO", weight: 0.08, note: "Cylindrical cells for Model S/X Plaid" },
    // Semiconductors
    { name: "NXP Semiconductors", type: "SUPPLIES_TO", weight: 0.05, note: "Vehicle control MCUs (body, gateway, ADAS)" },
    { name: "Texas Instruments", type: "SUPPLIES_TO", weight: 0.03, note: "Analog chips across vehicle systems" },
  ];

  // Ensure Tesla node exists
  await runQuery(`MERGE (c:Company {name: 'Tesla'})`);
  console.log("Upserted Tesla node");

  for (const s of teslaSuppliers) {
    await runQuery(`MERGE (c:Company {name: $name})`, { name: s.name });
    await runQuery(`
      MATCH (a:Company {name: $from}), (b:Company {name: 'Tesla'})
      MERGE (a)-[r:SUPPLIES_TO]->(b)
      SET r.weight = $weight, r.source = 'manual-seed'
    `, { from: s.name, weight: s.weight });
    console.log(`  ✓ (${s.name}) -[SUPPLIES_TO]-> (Tesla) w=${s.weight}  // ${s.note}`);
  }

  // ── 4. Verify final state ──────────────────────────────────────────────────
  const all = await runQuery(`
    MATCH (a:Company)-[r]->(b:Company)
    WHERE b.name = 'Tesla' OR a.name IN ['HXL','ADI']
    RETURN a.name AS from, type(r) AS rel, b.name AS to, r.weight AS w
    ORDER BY a.name
  `);
  console.log("\n── Verification ───────────────────────────────────────────");
  all.forEach(r => console.log(`  (${r.from})-[${r.rel}]->(${r.to}) w=${r.w}`));

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
