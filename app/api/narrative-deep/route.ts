import { Question } from 'rocketride'
import { rrClient, getNarrativeToken, invalidateNarrativeToken } from '@/lib/rocketride'

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  try {
    const token = await getNarrativeToken()
    const { shock_company, shock_pct, affected, short_narrative } = body
    const isPositive = (shock_pct as number) >= 0
    const shock_pct_display = `${isPositive ? '+' : ''}${((shock_pct as number) * 100).toFixed(1)}%`

    const question = new Question()
    question.addInstruction('Role', 'You are a senior financial risk analyst writing a detailed research brief for institutional investors.')
    question.addInstruction('Format', `You are expanding on an existing short analysis. Continue and deepen it — do not restate what was already said. Write exactly 4 paragraphs of plain prose. No headers, no bullets, no lists. Each paragraph is 3–5 sentences.

Paragraph 1 — Deeper Context: Go beyond the summary. Explain what a ${shock_pct_display} move means for ${shock_company as string} in market context, what likely caused it, and why it matters beyond the company itself.

Paragraph 2 — First-Order Contagion Detail: Name the 4–5 most exposed companies by exposure percentage. For each, explain the specific supply chain relationship and the operational consequence — go deeper than the summary.

Paragraph 3 — Sector and Second-Order Effects: How does this propagate through the broader industry? Which sectors are systemically at risk and why? Call out any counterintuitive beneficiaries.

Paragraph 4 — Investor Action Plan: Give specific, actionable recommendations. Name tickers. State whether to buy, sell, or hedge. Include key risk factors and what signals to monitor over the coming weeks.`)
    question.addContext(JSON.stringify({ shock_company, shock_pct_display, affected, short_narrative }))
    question.addQuestion('Expand on the short analysis with the full deep-dive.')

    const response = await rrClient.chat({ token, question })
    const narrative = response.answers?.[0] ?? ''

    return Response.json({ narrative })
  } catch (err) {
    console.error('Deep narrative error:', err)
    invalidateNarrativeToken()
    return Response.json({ error: 'Failed to generate analysis' }, { status: 500 })
  }
}
