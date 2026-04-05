import { runQuery } from '@/lib/neo4j'
import { resolveCompany } from '@/lib/company-aliases'

function toNumber(val: unknown): number {
  if (typeof val === 'number') return val
  if (val !== null && typeof val === 'object' && 'toNumber' in val) {
    return (val as { toNumber(): number }).toNumber()
  }
  return Number(val)
}

const NEIGHBOR_QUERY = `
  MATCH (c:Company {name: $name})-[r]-(neighbor:Company)
  RETURN neighbor.name AS neighbor,
         type(r)        AS rel_type,
         r.weight       AS weight,
         startNode(r).name = $name AS outgoing`

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params
  const decoded = decodeURIComponent(name)

  try {
    // Try the exact name first (neighbor names from the graph are already canonical).
    // Only fall back to resolveCompany if the direct lookup returns nothing — this
    // handles user-typed input like tickers without mangling canonical node names.
    let rows = await runQuery(NEIGHBOR_QUERY, { name: decoded })
    if (rows.length === 0) {
      const resolved = resolveCompany(decoded)
      if (resolved !== decoded) {
        rows = await runQuery(NEIGHBOR_QUERY, { name: resolved })
      }
    }
    const canonical = decoded

    // Use maps to deduplicate — same neighbor can appear via multiple relationship types
    const supplierMap = new Map<string, number>()
    const customerMap = new Map<string, number>()

    for (const row of rows) {
      const neighbor = String(row.neighbor)
      const weight = toNumber(row.weight)
      const relType = String(row.rel_type)
      const outgoing = Boolean(row.outgoing)

      // outgoing SUPPLIES_TO  → this company supplies TO neighbor (neighbor is a customer)
      // incoming SUPPLIES_TO  → neighbor supplies TO this company (neighbor is a supplier)
      // outgoing CUSTOMER_OF  → this company is customer of neighbor (neighbor is a supplier)
      // incoming CUSTOMER_OF  → neighbor is customer of this company (neighbor is a customer)
      const isSupplier =
        (relType === 'SUPPLIES_TO' && !outgoing) ||
        (relType === 'CUSTOMER_OF' && outgoing)
      const isCustomer =
        (relType === 'SUPPLIES_TO' && outgoing) ||
        (relType === 'CUSTOMER_OF' && !outgoing)

      if (isSupplier) {
        supplierMap.set(neighbor, Math.max(supplierMap.get(neighbor) ?? 0, weight))
      } else if (isCustomer) {
        customerMap.set(neighbor, Math.max(customerMap.get(neighbor) ?? 0, weight))
      }
    }

    const suppliers = [...supplierMap.entries()]
      .map(([name, weight]) => ({ name, weight }))
      .sort((a, b) => b.weight - a.weight)
    const customers = [...customerMap.entries()]
      .map(([name, weight]) => ({ name, weight }))
      .sort((a, b) => b.weight - a.weight)

    return Response.json({ name: canonical, suppliers, customers })
  } catch (err) {
    console.error('company profile error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
