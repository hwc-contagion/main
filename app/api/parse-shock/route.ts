import OpenAI from "openai";

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

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a financial analyst. Given a natural language description of an event affecting a company, extract:
- shock_company: the exact company name as it would appear in a financial database (e.g. "Apple", "Tesla", "Boeing")
- shock_pct: a decimal between -1 and 1 representing the estimated earnings shock (e.g. -0.35 for a 35% negative shock)

Be realistic. A minor event is ±5-10%, a major event is ±20-40%, a catastrophic event is ±50%+. Positive events get positive values.

Respond with JSON only: { "shock_company": "...", "shock_pct": 0.0, "reasoning": "one sentence explaining the estimate" }`,
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  let parsed: { shock_company?: string; shock_pct?: number; reasoning?: string };
  try {
    parsed = JSON.parse(raw);
  } catch {
    return Response.json({ error: "Failed to parse GPT response" }, { status: 500 });
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
