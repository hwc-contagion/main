interface AffectedCompany {
  company: string
  exposure: number
  hop: number
}

interface ResultsTableProps {
  affected: AffectedCompany[]
}

const HOP_COLORS: Record<number, string> = {
  1: 'text-red-400',
  2: 'text-yellow-400',
  3: 'text-zinc-400',
}

export default function ResultsTable({ affected }: ResultsTableProps) {
  if (affected.length === 0) {
    return (
      <p className="text-zinc-500 text-sm mt-6">No affected companies found in the graph.</p>
    )
  }

  const sorted = [...affected].sort((a, b) => Math.abs(b.exposure) - Math.abs(a.exposure))

  function formatExposure(exposure: number): string {
    const pct = (exposure * 100).toFixed(1)
    return exposure >= 0 ? `+${pct}%` : `${pct}%`
  }

  return (
    <div className="mt-8">
      <h2 className="text-lg font-semibold mb-3">Affected Companies</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-zinc-500 border-b border-zinc-800 text-left">
            <th className="pb-2 font-medium">Company</th>
            <th className="pb-2 font-medium">Exposure</th>
            <th className="pb-2 font-medium">Hop</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr key={row.company} className="border-b border-zinc-800/50">
              <td className="py-2.5 font-medium">{row.company}</td>
              <td className={`py-2.5 font-semibold ${row.exposure < 0 ? 'text-red-400' : 'text-green-400'}`}>
                {formatExposure(row.exposure)}
              </td>
              <td className={`py-2.5 ${HOP_COLORS[row.hop] ?? 'text-zinc-400'}`}>
                {row.hop}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
