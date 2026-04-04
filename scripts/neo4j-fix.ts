import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "../.env.local") });

import { runQuery } from "../lib/neo4j";

async function main() {
  // ── 1. Merge QRVO (ticker) ← Qorvo (LLM name) ──────────────────────────
  // Both nodes have the same Apple + Samsung relationships — keep QRVO, delete Qorvo
  await runQuery(`MATCH (n:Company {name: 'Qorvo'}) DETACH DELETE n`);
  console.log("Deleted duplicate Qorvo node (kept QRVO)");

  // ── 2. Delete duplicate edges (same from/type/to, different rel id) ──────
  // This happens when a node merge creates a second copy of an existing relationship.
  for (const relType of ["CUSTOMER_OF", "SUPPLIES_TO", "CREDITOR_OF"]) {
    await runQuery(`
      MATCH (a)-[r1:\`${relType}\`]->(b)
      WITH a, b, collect(r1) AS rels
      WHERE size(rels) > 1
      UNWIND rels[1..] AS dup
      DELETE dup
    `);
  }
  console.log("Removed duplicate edges");

  // ── 3. Fix BWA: wrong CUSTOMER_OF Ford/Volkswagen → delete (SUPPLIES_TO already correct) ──
  await runQuery(`
    MATCH (a:Company {name: 'BWA'})-[r:CUSTOMER_OF]->(:Company)
    DELETE r
  `);
  console.log("Deleted BWA CUSTOMER_OF (kept SUPPLIES_TO)");

  // ── 4. Fix APTV: CUSTOMER_OF GM/Ford/Stellantis should be SUPPLIES_TO ────
  const aptvRels = await runQuery(`
    MATCH (a:Company {name: 'APTV'})-[r:CUSTOMER_OF]->(b:Company)
    RETURN b.name AS to, r.weight AS w, r.source AS src
  `);
  await runQuery(`MATCH (a:Company {name: 'APTV'})-[r:CUSTOMER_OF]->() DELETE r`);
  for (const rel of aptvRels) {
    await runQuery(`
      MATCH (a:Company {name: 'APTV'}), (b:Company {name: $to})
      MERGE (a)-[r:SUPPLIES_TO]->(b)
      SET r.weight = $w, r.source = $src
    `, { to: rel.to, w: rel.w ?? 0.1, src: rel.src ?? "edgar" });
  }
  console.log("Fixed APTV: CUSTOMER_OF → SUPPLIES_TO for", aptvRels.map(r => r.to).join(", "));

  // ── 5. Fix ALV (Autoliv): CUSTOMER_OF should be SUPPLIES_TO (Autoliv sells to OEMs) ──
  const alvRels = await runQuery(`
    MATCH (a:Company {name: 'Autoliv'})-[r:CUSTOMER_OF]->(b:Company)
    RETURN b.name AS to, r.weight AS w, r.source AS src
  `);
  await runQuery(`MATCH (a:Company {name: 'Autoliv'})-[r:CUSTOMER_OF]->() DELETE r`);
  for (const rel of alvRels) {
    await runQuery(`
      MATCH (a:Company {name: 'Autoliv'}), (b:Company {name: $to})
      MERGE (a)-[r:SUPPLIES_TO]->(b)
      SET r.weight = $w, r.source = $src
    `, { to: rel.to, w: rel.w ?? 0.1, src: rel.src ?? "edgar" });
  }
  console.log("Fixed Autoliv: CUSTOMER_OF → SUPPLIES_TO");

  // ── 6. Fix DCO (Ducommun): CUSTOMER_OF Boeing/RTX/Airbus should be SUPPLIES_TO ──
  const dcoRels = await runQuery(`
    MATCH (a:Company {name: 'DCO'})-[r:CUSTOMER_OF]->(b:Company)
    RETURN b.name AS to, r.weight AS w, r.source AS src
  `);
  await runQuery(`MATCH (a:Company {name: 'DCO'})-[r:CUSTOMER_OF]->() DELETE r`);
  for (const rel of dcoRels) {
    await runQuery(`
      MATCH (a:Company {name: 'DCO'}), (b:Company {name: $to})
      MERGE (a)-[r:SUPPLIES_TO]->(b)
      SET r.weight = $w, r.source = $src
    `, { to: rel.to, w: rel.w ?? 0.1, src: rel.src ?? "edgar" });
  }
  console.log("Fixed DCO: CUSTOMER_OF → SUPPLIES_TO for", dcoRels.map(r => r.to).join(", "));

  // ── Final state ──────────────────────────────────────────────────────────
  const all = await runQuery(`
    MATCH (a:Company)-[r]->(b:Company)
    RETURN a.name AS from, type(r) AS rel, b.name AS to, r.weight AS w
    ORDER BY a.name, type(r), b.name
  `);
  console.log("\n── Final relationships ──────────────────────────");
  all.forEach(r => console.log(`  (${r.from})-[${r.rel}]->(${r.to}) w=${r.w}`));
  console.log(`\nTotal: ${all.length} relationships`);

  const nodes = await runQuery(`MATCH (n:Company) RETURN count(n) AS c`);
  console.log(`Nodes: ${nodes[0].c}`);

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
