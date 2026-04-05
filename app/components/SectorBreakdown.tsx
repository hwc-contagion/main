'use client'

import { useMemo } from 'react'
import { COMPANY_SECTOR, SECTOR_COLORS, SECTOR_ORDER } from '@/lib/sectors'

interface AffectedCompany {
  company: string
  exposure: number
  hop: number
}

interface Props {
  affected: AffectedCompany[]
}


// Phantom bar widths shown before any analysis is run
const PHANTOM_WIDTHS: Record<string, number> = {
  'Consumer Tech': 78,
  'Semiconductors': 100,
  'Aerospace': 52,
  'E-commerce': 68,
  'Logistics': 38,
  'Automotive': 61,
}

export default function SectorBreakdown({ affected }: Props) {
  const rows = useMemo(() => {
    const totals: Record<string, number> = {}
    const counts: Record<string, number> = {}
    affected.forEach(a => {
      const s = COMPANY_SECTOR[a.company]
      if (!s) return
      totals[s] = (totals[s] ?? 0) + Math.abs(a.exposure)
      counts[s] = (counts[s] ?? 0) + 1
    })
    const avgs = Object.fromEntries(
      Object.entries(totals).map(([s, t]) => [s, t / counts[s]])
    )
    const maxAvg = Math.max(...Object.values(avgs), 0.001)
    return Object.entries(avgs)
      .sort((a, b) => b[1] - a[1])
      .map(([sector, avg]) => ({
        sector,
        avg,
        count: counts[sector],
        barPct: (avg / maxAvg) * 100,
      }))
  }, [affected])

  const isEmpty = rows.length === 0

  return (
    <div
      className={`rounded-2xl p-5 ${!isEmpty ? 'card-appear' : ''}`}
      style={{ background: 'linear-gradient(160deg, #1c1c1f, #141416)', boxShadow: '0 0 0 1px rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)' }}
    >
      <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
        <span className="w-1 h-3.5 rounded-full bg-blue-500 opacity-80 inline-block" />
        Sector Exposure
      </h2>

      {isEmpty ? (
        // ── Placeholder ────────────────────────────────────────────────────
        <div className="relative">
          <div className="flex flex-col gap-3.5">
            {SECTOR_ORDER.map((sector, i) => (
              <div key={sector}>
                <div className="flex justify-between items-baseline mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: SECTOR_COLORS[sector], opacity: 0.25 }}
                    />
                    <span
                      className="text-xs font-medium"
                      style={{ color: '#52525b', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.03em' }}
                    >
                      {sector}
                    </span>
                  </div>
                </div>
                <div className="h-1 rounded-full" style={{ background: '#27272a' }}>
                  <svg width={`${PHANTOM_WIDTHS[sector]}%`} height="4" style={{ display: 'block' }}>
                    <rect width="100%" height="4" rx="2" fill={SECTOR_COLORS[sector]} opacity="0.18">
                      <animate
                        attributeName="opacity"
                        values="0.12;0.28;0.12"
                        dur="2.6s"
                        begin={`${i * 0.18}s`}
                        repeatCount="indefinite"
                      />
                    </rect>
                  </svg>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-center mt-4" style={{ color: '#3f3f46', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.08em' }}>
            RUN AN ANALYSIS TO SEE BREAKDOWN
          </p>
        </div>
      ) : (
        // ── Live data ──────────────────────────────────────────────────────
        <div className="flex flex-col gap-3">
          {rows.map(({ sector, avg, count, barPct }) => (
            <div key={sector}>
              <div className="flex justify-between items-baseline mb-1.5">
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: SECTOR_COLORS[sector] ?? '#71717a' }}
                  />
                  <span className="text-xs font-medium text-zinc-300">{sector}</span>
                </div>
                <span className="text-[11px] font-mono text-zinc-500">
                  {count} {count === 1 ? 'co' : 'cos'} · avg {(avg * 100).toFixed(1)}%
                </span>
              </div>
              <div className="h-1 bg-zinc-800 rounded-full">
                <div
                  className="h-1 rounded-full"
                  style={{
                    width: `${barPct}%`,
                    background: SECTOR_COLORS[sector] ?? '#71717a',
                    transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
