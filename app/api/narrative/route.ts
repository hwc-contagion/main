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
    const { shock_company, shock_pct, affected } = body
    const isPositive = (shock_pct as number) >= 0
    const shock_pct_display = `${isPositive ? '+' : ''}${((shock_pct as number) * 100).toFixed(1)}%`

    const question = new Question()
    question.addInstruction('Role', 'You are a financial risk analyst.')
    question.addInstruction('Format', `Respond with exactly 4 sentences of plain prose. No headers. No bullet points. No lists. No sections. No caveats. Just 4 sentences in a single paragraph. Sentence 1: the shock and its magnitude. Sentence 2: the top 2-3 most exposed companies and their exposure values. Sentence 3: why those exposures are ${isPositive ? 'significant upside opportunities' : 'dangerous'}. Sentence 4: a specific investor action naming the ticker. Stop after sentence 4.`)
    question.addContext(JSON.stringify({ shock_company, shock_pct_display, affected }))
    question.addQuestion('Generate the risk narrative.')

    const response = await rrClient.chat({ token, question })
    const narrative = response.answers?.[0] ?? ''

    return Response.json({ narrative })
  } catch (err) {
    console.error('Narrative error:', err)
    invalidateNarrativeToken()
    return Response.json({ error: 'Failed to generate narrative' }, { status: 500 })
  }
}
