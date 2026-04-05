import { runQuery } from '@/lib/neo4j'

function toNumber(val: unknown): number {
  if (typeof val === 'number') return val
  if (val !== null && typeof val === 'object' && 'toNumber' in val) {
    return (val as { toNumber(): number }).toNumber()
  }
  return Number(val)
}

const NODES_QUERY = `MATCH (c:Company) RETURN c.name AS name ORDER BY c.name`
const EDGES_QUERY = `
  MATCH (a:Company)-[r]->(b:Company)
  RETURN a.name AS from, b.name AS to, type(r) AS rel_type, r.weight AS weight
`

export async function GET() {
  try {
    const [nodeRows, edgeRows] = await Promise.all([
      runQuery(NODES_QUERY, {}),
      runQuery(EDGES_QUERY, {}),
    ])

    const nodes = nodeRows.map(r => ({ name: String(r.name) }))

    // Deduplicate directed edges — same (from,to) pair keeps max weight
    const edgeMap = new Map<string, { from: string; to: string; rel_type: string; weight: number }>()
    for (const row of edgeRows) {
      const from = String(row.from)
      const to   = String(row.to)
      const rel_type = String(row.rel_type)
      const weight   = toNumber(row.weight)
      const key = `${from}→${to}`
      const existing = edgeMap.get(key)
      if (!existing || weight > existing.weight) {
        edgeMap.set(key, { from, to, rel_type, weight })
      }
    }

    return Response.json({ nodes, edges: [...edgeMap.values()] })
  } catch (err) {
    console.error('full graph error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
