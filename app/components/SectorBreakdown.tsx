'use client'

import { useMemo } from 'react'

interface AffectedCompany {
  company: string
  exposure: number
  hop: number
}

interface Props {
  affected: AffectedCompany[]
}

const COMPANY_SECTOR: Record<string, string> = {
  Apple:                'Consumer Tech',
  TSMC:                 'Semiconductors',
  ASML:                 'Semiconductors',
  Qualcomm:             'Semiconductors',
  Broadcom:             'Semiconductors',
  Samsung:              'Semiconductors',
  Nvidia:               'Semiconductors',
  CRUS:                 'Semiconductors',
  SWKS:                 'Semiconductors',
  QRVO:                 'Semiconductors',
  AMKR:                 'Semiconductors',
  LRCX:                 'Semiconductors',
  ENTG:                 'Semiconductors',
  ADI:                  'Semiconductors',
  MCHP:                 'Semiconductors',
  GlobalFoundries:      'Semiconductors',
  'NXP Semiconductors': 'Semiconductors',
  'Analog Devices':     'Semiconductors',
  'Microchip Technology': 'Semiconductors',
  'Marvell Technology': 'Semiconductors',
  'Monolithic Power':   'Semiconductors',
  'Texas Instruments':  'Semiconductors',
  'ON Semiconductor':   'Semiconductors',
  Wolfspeed:            'Semiconductors',
  'Applied Materials':  'Semiconductors',
  'Lam Research':       'Semiconductors',
  Boeing:               'Aerospace',
  'Spirit AeroSystems': 'Aerospace',
  Airbus:               'Aerospace',
  RTX:                  'Aerospace',
  DCO:                  'Aerospace',
  HXL:                  'Aerospace',
  'Lockheed Martin':    'Aerospace',
  'General Dynamics':   'Aerospace',
  Textron:              'Aerospace',
  GKN:                  'Aerospace',
  'Triumph Group':      'Aerospace',
  Amazon:               'E-commerce',
  Meta:                 'E-commerce',
  Google:               'E-commerce',
  Microsoft:            'E-commerce',
  UPS:                  'Logistics',
  FedEx:                'Logistics',
  Tesla:                'Automotive',
  Ford:                 'Automotive',
  GM:                   'Automotive',
  'LG Energy Solution': 'Automotive',
  Volkswagen:           'Automotive',
  Stellantis:           'Automotive',
  Autoliv:              'Automotive',
  BWA:                  'Automotive',
  APTV:                 'Automotive',
  Panasonic:            'Automotive',
  CATL:                 'Automotive',
  'Samsung SDI':        'Automotive',
  Toyota:               'Automotive',
  BYD:                  'Automotive',
  GE:                   'Industrials',
  Honeywell:            'Industrials',
  Albemarle:            'Industrials',
  'TE Connectivity':    'Industrials',
  CLS:                  'Tech',
  IBM:                  'Tech',
  Dell:                 'Tech',
  HPE:                  'Tech',
  'Super Micro':        'Tech',
  'Arista Networks':    'Tech',
}

const SECTOR_COLORS: Record<string, string> = {
  'Consumer Tech': '#818cf8',
  'Semiconductors': '#a78bfa',
  'Aerospace':      '#60a5fa',
  'E-commerce':     '#f59e0b',
  'Logistics':      '#34d399',
  'Automotive':     '#f87171',
  'Tech':           '#38bdf8',
  'Industrials':    '#fb923c',
}

const SECTOR_ORDER = [
  'Consumer Tech',
  'Semiconductors',
  'Aerospace',
  'E-commerce',
  'Logistics',
  'Automotive',
  'Tech',
  'Industrials',
]

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
    const max = Math.max(...Object.values(totals), 0.001)
    return Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .map(([sector, total]) => ({
        sector,
        total,
        count: counts[sector],
        barPct: (total / max) * 100,
      }))
  }, [affected])

  const isEmpty = rows.length === 0

  return (
    <div className={`bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg shadow-black/20 ${!isEmpty ? 'card-appear' : ''}`}>
      <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-4">
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
          {rows.map(({ sector, total, count, barPct }) => (
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
                  {count} {count === 1 ? 'co' : 'cos'} · {(total * 100).toFixed(1)}%
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
