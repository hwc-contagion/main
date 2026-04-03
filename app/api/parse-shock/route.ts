import { Question } from "rocketride";
import { rrClient, getParseShockToken, invalidateParseShockToken } from "@/lib/rocketride";

export async function POST(request: Request) {
  let prompt: string;
  try {
    const body = await request.json();
    prompt = body.prompt;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof prompt !== "string" || !prompt.trim()) {
    return Response.json({ error: "prompt must be a non-empty string" }, { status: 400 });
  }

  let token: string;
  try {
    token = await getParseShockToken();
  } catch (err) {
    console.error("RocketRide parse-shock pipeline failed to start:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }

  let parsed: { shock_company?: string; shock_pct?: number; reasoning?: string };
  try {
    const question = new Question({ expectJson: true });
    question.addInstruction("Role", "You are a financial analyst.");
    question.addInstruction("Task", `Given a natural language description of an event affecting a company, extract:
- shock_company: the exact company name as it would appear in a financial database (e.g. "Apple", "Tesla", "Boeing")
- shock_pct: a decimal between -1 and 1 representing the estimated earnings shock (e.g. -0.35 for a 35% negative shock)
- reasoning: one sentence explaining the estimate

Be realistic. A minor event is ±5-10%, a major event is ±20-40%, a catastrophic event is ±50%+. Positive events get positive values.`);
    question.addExample("Apple CEO resigns unexpectedly", { shock_company: "Apple", shock_pct: -0.15, reasoning: "Leadership uncertainty typically causes a moderate negative shock." });
    question.addQuestion(prompt);

    const response = await rrClient.chat({ token, question });
    parsed = response.answers?.[0] ?? {};
  } catch (err) {
    console.error("RocketRide parse-shock chat failed:", err);
    invalidateParseShockToken();
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }

  if (!parsed.shock_company || typeof parsed.shock_pct !== "number") {
    return Response.json({ error: "Could not extract shock parameters from prompt" }, { status: 422 });
  }

  return Response.json({
    shock_company: parsed.shock_company,
    shock_pct: parsed.shock_pct,
    reasoning: parsed.reasoning ?? null,
  });
}
