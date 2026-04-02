import { runQuery } from "@/lib/neo4j";

// Neo4j returns small integers as native JS numbers, but guard against
// the Integer object form just in case.
function toNumber(val: unknown): number {
  if (typeof val === "number") return val;
  if (val !== null && typeof val === "object" && "toNumber" in val) {
    return (val as { toNumber(): number }).toNumber();
  }
  return Number(val);
}

export async function POST(request: Request) {
  let shock_company: string;
  let shock_pct: number;

  try {
    const body = await request.json();
    shock_company = body.shock_company;
    shock_pct = body.shock_pct;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof shock_company !== "string" || !shock_company.trim()) {
    return Response.json(
      { error: "shock_company must be a non-empty string" },
      { status: 400 }
    );
  }
  if (typeof shock_pct !== "number" || shock_pct < -1 || shock_pct > 1) {
    return Response.json(
      { error: "shock_pct must be a number between -1 and 1" },
      { status: 400 }
    );
  }

  // For each company reachable within 3 hops (undirected), compute the
  // cumulative weight product along the highest-weight path, then scale
  // by shock_pct to get the final exposure fraction.
  const query = `
    MATCH path = (shock:Company {name: $shock_company})-[rels*1..3]-(affected:Company)
    WHERE shock <> affected
    WITH affected.name AS company,
         length(path) AS hops,
         reduce(w = 1.0, r IN rels | w * r.weight) AS path_weight
    ORDER BY path_weight DESC
    WITH company, collect({ hops: hops, weight: path_weight })[0] AS best
    RETURN company,
           best.hops AS hops,
           best.weight * $shock_pct AS exposure
    ORDER BY exposure DESC
  `;

  const rows = await runQuery(query, { shock_company, shock_pct });

  const affected = rows.map((row) => ({
    company: String(row.company),
    hop: toNumber(row.hops),
    exposure: toNumber(row.exposure),
  }));

  return Response.json({ shock_company, shock_pct, affected, narrative: null });
}
