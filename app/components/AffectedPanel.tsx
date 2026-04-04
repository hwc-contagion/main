'use client'

import { useMemo } from 'react'

interface AffectedCompany {
  company: string
  exposure: number
  hop: number
}

interface Edge {
  from: string
  to: string
  rel_type: string
  weight: number
}

interface Props {
  shockCompany: string
  affected: AffectedCompany[]
  edges: Edge[]
}

const COMPANY_SECTOR: Record<string, string> = {
  Apple:               'Consumer Tech',
  TSMC:                'Semiconductors',
  ASML:                'Semiconductors',
  Qualcomm:            'Semiconductors',
  Broadcom:            'Semiconductors',
  Samsung:             'Semiconductors',
  Nvidia:              'Semiconductors',
  CRUS:                'Semiconductors',
  SWKS:                'Semiconductors',
  QRVO:                'Semiconductors',
  AMKR:                'Semiconductors',
  LRCX:                'Semiconductors',
  ENTG:                'Semiconductors',
  GlobalFoundries:     'Semiconductors',
  Boeing:              'Aerospace',
  'Spirit AeroSystems':'Aerospace',
  Airbus:              'Aerospace',
  RTX:                 'Aerospace',
  DCO:                 'Aerospace',
  Amazon:              'E-commerce',
  Meta:                'E-commerce',
  Google:              'E-commerce',
  UPS:                 'Logistics',
  FedEx:               'Logistics',
  Ford:                'Automotive',
  GM:                  'Automotive',
  'LG Energy Solution':'Automotive',
  Volkswagen:          'Automotive',
  Stellantis:          'Automotive',
  Autoliv:             'Automotive',
  BWA:                 'Automotive',
  APTV:                'Automotive',
  CLS:                 'Tech',
  IBM:                 'Tech',
  Dell:                'Tech',
  HPE:                 'Tech',
  Honeywell:           'Industrials',
  'Applied Materials': 'Semiconductors',
  'Lam Research':      'Semiconductors',
}

const SECTOR_DOT: Record<string, string> = {
  'Consumer Tech': '#818cf8',
  'Semiconductors': '#a78bfa',
  'Aerospace':      '#60a5fa',
  'E-commerce':     '#f59e0b',
  'Logistics':      '#34d399',
  'Automotive':     '#f87171',
  'Tech':           '#38bdf8',
  'Industrials':    '#fb923c',
}

function buildPath(
  target: string,
  targetHop: number,
  shockCompany: string,
  affected: AffectedCompany[],
  edges: Edge[],
): string[] {
  if (targetHop <= 1) return [shockCompany, target]
  const prevHopNames = new Set(
    affected.filter(a => a.hop === targetHop - 1).map(a => a.company)
  )
  const link = edges.find(e =>
    (e.from === target && prevHopNames.has(e.to)) ||
    (e.to === target && prevHopNames.has(e.from))
  )
  if (!link) return [shockCompany, target]
  const mid = link.from === target ? link.to : link.from
  return [...buildPath(mid, targetHop - 1, shockCompany, affected, edges), target]
}

// ── Placeholder ────────────────────────────────────────────────────────────────

function Placeholder() {
  const rows = [
    { w1: 48, w2: 64, w3: 36 },
    { w1: 56, w2: 44, w3: 52 },
    { w1: 40, w2: 72, w3: 44 },
    { w1: 60, w2: 52, w3: 38 },
  ]
  return (
    <div className="flex flex-col divide-y divide-zinc-800/50">
      {rows.map((r, i) => (
        <div key={i} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
          {/* path placeholder */}
          <div className="flex items-center gap-1 flex-1 min-w-0">
            <div className="h-2 rounded bg-zinc-700/50 animate-pulse" style={{ width: r.w1 }} />
            <span className="text-zinc-700 text-[10px]">›</span>
            <div className="h-2 rounded bg-zinc-700/30 animate-pulse" style={{ width: r.w2 }} />
          </div>
          {/* exposure placeholder */}
          <div className="h-3.5 w-12 rounded bg-zinc-800 animate-pulse shrink-0" />
          {/* bar placeholder */}
          <div className="h-1 w-16 rounded bg-zinc-800/60 animate-pulse shrink-0" />
        </div>
      ))}
      <p className="pt-4 text-center text-[10px] text-zinc-600 uppercase tracking-widest">
        Run an analysis to see results
      </p>
    </div>
  )
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function AffectedPanel({ shockCompany, affected, edges }: Props) {
  const sorted = useMemo(
    () => [...affected].sort((a, b) => Math.abs(b.exposure) - Math.abs(a.exposure)),
    [affected]
  )

  const maxAbs = useMemo(
    () => Math.max(...sorted.map(r => Math.abs(r.exposure)), 0.001),
    [sorted]
  )

  const stats = useMemo(() => {
    if (affected.length === 0) return null
    const avg = affected.reduce((s, a) => s + Math.abs(a.exposure), 0) / affected.length
    const totals: Record<string, number> = {}
    affected.forEach(a => {
      const s = COMPANY_SECTOR[a.company]
      if (s) totals[s] = (totals[s] ?? 0) + Math.abs(a.exposure)
    })
    const topSector = Object.entries(totals).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'
    return { count: affected.length, avg, topSector }
  }, [affected])

  const isEmpty = affected.length === 0

  return (
    <div
      className={`bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg shadow-black/20 ${!isEmpty ? 'card-appear' : ''}`}
      style={!isEmpty ? { animationDelay: '40ms' } : undefined}
    >
      <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-4">
        Affected Companies
      </h2>

      {isEmpty ? (
        <Placeholder />
      ) : (
        <>
          {/* Summary stats */}
          {stats && (
            <div className="flex gap-2 mb-4">
              {[
                { label: 'Affected', value: String(stats.count) },
                { label: 'Avg exposure', value: `${(stats.avg * 100).toFixed(1)}%` },
                { label: 'Top sector', value: stats.topSector },
              ].map(s => (
                <div key={s.label} className="flex-1 bg-zinc-800/50 border border-zinc-700/40 rounded-xl px-3 py-2">
                  <p className="text-[9px] text-zinc-500 uppercase tracking-widest mb-0.5">{s.label}</p>
                  <p className="text-xs font-semibold text-zinc-100 truncate">{s.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Rows */}
          <div className="flex flex-col divide-y divide-zinc-800/50">
            {sorted.map(row => {
              const chain = buildPath(row.company, row.hop, shockCompany, affected, edges)
              const isPos = row.exposure >= 0
              const barPct = (Math.abs(row.exposure) / maxAbs) * 100
              const dot = SECTOR_DOT[COMPANY_SECTOR[row.company] ?? '']

              return (
                <div
                  key={row.company}
                  className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                >
                  {/* Path chain */}
                  <div className="flex items-center gap-1 flex-1 min-w-0 overflow-hidden">
                    {chain.map((node, i) => (
                      <span key={i} className="flex items-center gap-1 min-w-0">
                        {i > 0 && (
                          <span className="text-zinc-700 text-[10px] select-none shrink-0">›</span>
                        )}
                        <span className={`text-xs font-medium truncate leading-none ${
                          i === 0
                            ? 'text-orange-400 shrink-0'
                            : i === chain.length - 1
                            ? 'text-zinc-100 shrink-0'
                            : 'text-zinc-500 shrink-0'
                        }`}>
                          {node}
                        </span>
                      </span>
                    ))}
                  </div>

                  {/* Sector dot */}
                  {dot && (
                    <div
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: dot }}
                    />
                  )}

                  {/* Exposure + bar */}
                  <div className="flex flex-col items-end shrink-0 gap-1">
                    <span className={`text-xs font-mono font-semibold leading-none ${isPos ? 'text-green-400' : 'text-red-400'}`}>
                      {isPos ? '+' : ''}{(row.exposure * 100).toFixed(1)}%
                    </span>
                    <div className="h-0.5 w-16 rounded-full bg-zinc-800">
                      <div
                        className={`h-0.5 rounded-full ${isPos ? 'bg-green-400/50' : 'bg-red-400/50'}`}
                        style={{ width: `${barPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
