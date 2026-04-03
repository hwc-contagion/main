import { runQuery } from "@/lib/neo4j";
import { Question } from "rocketride";
import { rrClient, getNarrativeToken, invalidateNarrativeToken } from "@/lib/rocketride";

function toNumber(val: unknown): number {
  if (typeof val === "number") return val;
  if (val !== null && typeof val === "object" && "toNumber" in val) {
    return (val as { toNumber(): number }).toNumber();
  }
  return Number(val);
}

export async function POST(request: Request) {
  try {
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const shock_company = body.shock_company;
    const shock_pct = body.shock_pct;

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

    let narrative: string | null = null;
    try {
      const token = await getNarrativeToken();
      const question = new Question();
      question.addInstruction("Role", "You are a financial risk analyst.");
      question.addInstruction("Format", "Respond with exactly 4 sentences of plain prose. No headers. No bullet points. No lists. No sections. No caveats. Just 4 sentences in a single paragraph. Sentence 1: the shock and its magnitude. Sentence 2: the top 2-3 most exposed companies and their exposure values. Sentence 3: why those exposures are dangerous. Sentence 4: a specific investor action (name the ticker). Stop after sentence 4.");
      question.addContext(JSON.stringify({ shock_company, shock_pct_display: `${(shock_pct * 100).toFixed(1)}%`, affected }));
      question.addQuestion("Generate the risk narrative.");
      const response = await rrClient.chat({ token, question });
      narrative = response.answers?.[0] ?? null;
    } catch (err) {
      console.error("RocketRide narrative failed:", err);
      invalidateNarrativeToken();
    }

    return Response.json({ shock_company, shock_pct, affected, narrative });
  } catch (err) {
    console.error("Unhandled error in POST /api/contagion:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
