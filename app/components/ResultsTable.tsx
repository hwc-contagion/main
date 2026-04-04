interface AffectedCompany {
  company: string
  exposure: number
  hop: number
}

interface ResultsTableProps {
  affected: AffectedCompany[]
}

const COMPANY_SECTOR: Record<string, string> = {
  Apple:               'Consumer Tech',
  TSMC:                'Semiconductors',
  ASML:                'Semiconductors',
  Qualcomm:            'Semiconductors',
  Broadcom:            'Semiconductors',
  Samsung:             'Semiconductors',
  Nvidia:              'Semiconductors',
  Boeing:              'Aerospace',
  'Spirit AeroSystems':'Aerospace',
  Amazon:              'E-commerce',
  UPS:                 'Logistics',
  FedEx:               'Logistics',
  Ford:                'Automotive',
  GM:                  'Automotive',
  'LG Energy Solution':'Automotive',
}

const HOP_BADGE: Record<number, string> = {
  1: 'bg-red-500/15 text-red-400 border border-red-500/25',
  2: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/25',
  3: 'bg-zinc-700/60 text-zinc-400 border border-zinc-600/50',
}

export default function ResultsTable({ affected }: ResultsTableProps) {
  if (affected.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg shadow-black/20">
        <p className="text-zinc-500 text-sm">No affected companies found in the graph.</p>
      </div>
    )
  }

  const sorted = [...affected].sort((a, b) => Math.abs(b.exposure) - Math.abs(a.exposure))
  const maxAbs = Math.max(...sorted.map(r => Math.abs(r.exposure)), 0.001)

  // Summary stats
  const avgExposure = affected.reduce((s, a) => s + Math.abs(a.exposure), 0) / affected.length
  const sectorTotals: Record<string, number> = {}
  affected.forEach(a => {
    const s = COMPANY_SECTOR[a.company]
    if (s) sectorTotals[s] = (sectorTotals[s] ?? 0) + Math.abs(a.exposure)
  })
  const topSector = Object.entries(sectorTotals).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'

  function formatExposure(exposure: number): string {
    const pct = (exposure * 100).toFixed(1)
    return exposure >= 0 ? `+${pct}%` : `${pct}%`
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg shadow-black/20">
      {/* Summary stats */}
      <div className="flex gap-3 mb-5">
        {[
          { label: 'Companies affected', value: String(affected.length) },
          { label: 'Avg. exposure', value: `${(avgExposure * 100).toFixed(1)}%` },
          { label: 'Hardest-hit sector', value: topSector },
        ].map(stat => (
          <div key={stat.label} className="flex-1 bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-3 py-2.5">
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">{stat.label}</p>
            <p className="text-sm font-semibold text-zinc-100 truncate">{stat.value}</p>
          </div>
        ))}
      </div>

      <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-4">
        Affected Companies
      </h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-zinc-600 border-b border-zinc-800 text-left">
            <th className="pb-2.5 font-medium">Company</th>
            <th className="pb-2.5 font-medium">Exposure</th>
            <th className="pb-2.5 font-medium">Hop</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr key={row.company} className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/30 transition-colors">
              <td className="py-3 font-medium text-zinc-200">{row.company}</td>
              <td className="py-3">
                <span className={`font-mono font-semibold ${row.exposure < 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {formatExposure(row.exposure)}
                </span>
                <div className="h-0.5 mt-1.5 rounded-full bg-zinc-800 w-20">
                  <div
                    className={`h-0.5 rounded-full ${row.exposure < 0 ? 'bg-red-400/50' : 'bg-green-400/50'}`}
                    style={{ width: `${(Math.abs(row.exposure) / maxAbs) * 100}%` }}
                  />
                </div>
              </td>
              <td className="py-3">
                <span className={`inline-flex items-center justify-center w-7 h-5 rounded text-xs font-semibold ${HOP_BADGE[row.hop] ?? HOP_BADGE[3]}`}>
                  {row.hop}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
