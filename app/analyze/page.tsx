'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import AffectedPanel from '../components/AffectedPanel'
import NarrativeBox from '../components/NarrativeBox'
import ContagionGraph from '../components/ContagionGraph'
import SectorBreakdown from '../components/SectorBreakdown'
import CompanyDrawer from '../components/CompanyDrawer'
import { getAnalyzeState, saveAnalyzeState } from '@/lib/analyzeStore'
import type { AffectedCompany, Edge, Results } from '@/lib/analyzeStore'
import { getHoldings, hasHoldings } from '@/lib/portfolioStore'
import { resolveCompany } from '@/lib/company-aliases'
import { COMPANY_SECTOR, SECTOR_COLORS } from '@/lib/sectors'

function TremorIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 48 48" fill="none">
      <line x1="24" y1="24" x2="5"  y2="10" stroke="#3b82f6" strokeWidth="1.2" opacity="0.4" />
      <line x1="24" y1="24" x2="43" y2="12" stroke="#3b82f6" strokeWidth="1.2" opacity="0.4" />
      <line x1="24" y1="24" x2="6"  y2="38" stroke="#3b82f6" strokeWidth="1.2" opacity="0.4" />
      <line x1="24" y1="24" x2="42" y2="37" stroke="#3b82f6" strokeWidth="1.2" opacity="0.4" />
      <line x1="24" y1="24" x2="24" y2="3"  stroke="#3b82f6" strokeWidth="1.2" opacity="0.4" />
      <circle cx="24" cy="24" r="11" fill="none" stroke="#3b82f6" strokeWidth="1.5" opacity="0.35" />
      <circle cx="24" cy="24" r="19" fill="none" stroke="#3b82f6" strokeWidth="1"   opacity="0.15" />
      <circle cx="5"  cy="10" r="2.5" fill="#3b82f6" opacity="0.75" />
      <circle cx="43" cy="12" r="2.5" fill="#3b82f6" opacity="0.75" />
      <circle cx="6"  cy="38" r="2.5" fill="#3b82f6" opacity="0.75" />
      <circle cx="42" cy="37" r="2.5" fill="#3b82f6" opacity="0.75" />
      <circle cx="24" cy="3"  r="2.5" fill="#3b82f6" opacity="0.75" />
      <circle cx="24" cy="24" r="6"   fill="#3b82f6" />
      <circle cx="24" cy="24" r="3"   fill="#eff6ff" />
    </svg>
  )
}

// ── Critical node algorithm (same as Explore page) ────────────────────────────
function findCriticalNode(
  nodeNames: string[],
  edges: { from: string; to: string }[],
): { node: string; disconnects: number } | null {
  if (nodeNames.length < 3) return null
  const adj = new Map<string, string[]>()
  nodeNames.forEach(n => adj.set(n, []))
  edges.forEach(e => {
    adj.get(e.from)?.push(e.to)
    adj.get(e.to)?.push(e.from)
  })
  function largestComponent(excluded: string): number {
    const remaining = nodeNames.filter(n => n !== excluded)
    if (!remaining.length) return 0
    const visited = new Set<string>()
    let largest = 0
    for (const start of remaining) {
      if (visited.has(start)) continue
      const comp = new Set([start])
      const q = [start]
      while (q.length) {
        const curr = q.shift()!
        for (const nb of adj.get(curr) ?? []) {
          if (nb !== excluded && !comp.has(nb)) { comp.add(nb); q.push(nb) }
        }
      }
      comp.forEach(n => visited.add(n))
      largest = Math.max(largest, comp.size)
    }
    return largest
  }
  const N = nodeNames.length
  let best = { node: '', disconnects: 0 }
  for (const name of nodeNames) {
    const d = (N - 1) - largestComponent(name)
    if (d > best.disconnects) best = { node: name, disconnects: d }
  }
  return best.disconnects > 0 ? best : null
}

// ── Help content ───────────────────────────────────────────────────────────────
const ANALYZE_HELP = [
  {
    title: 'Inputs',
    items: [
      { label: 'Manual', desc: 'Company name or ticker + shock % slider.' },
      { label: 'Natural language', desc: 'Describe a scenario in plain English — AI extracts the company and magnitude.' },
    ],
  },
  {
    title: 'Graph',
    items: [
      { label: 'Node size', desc: 'Larger = more exposed.' },
      { label: 'Ring color', desc: 'Sector. Hover for exact exposure %.' },
      { label: 'Top-N slider', desc: 'Limits how many companies are shown.' },
      { label: 'Click a node', desc: 'Opens the company profile.' },
    ],
  },
  {
    title: 'Panels',
    items: [
      { label: 'Critical Node', desc: 'Amber highlight — most structurally fragile company in the graph.' },
      { label: 'Portfolio Exposure', desc: 'Your weighted indirect exposure. Requires holdings set up in Portfolio.' },
      { label: 'Analyst Narrative', desc: 'AI summary. Hit "Learn more" for a full deep-dive.' },
    ],
  },
]

// Placeholder network shown before any analysis is run.
// To revert: delete this component and restore the old empty-state div.
function PlaceholderGraph() {
  const cx = 250, cy = 248
  const r1 = 105, r2 = 190

  const ring1 = [0, 1, 2].map(i => {
    const a = (i * 2 * Math.PI / 3) - Math.PI / 2
    return { x: cx + r1 * Math.cos(a), y: cy + r1 * Math.sin(a) }
  })
  const ring2 = [0, 1, 2, 3, 4].map(i => {
    const a = (i * 2 * Math.PI / 5) - Math.PI / 2
    return { x: cx + r2 * Math.cos(a), y: cy + r2 * Math.sin(a) }
  })

  const r1Labels = ['TSMC', 'NVDA', 'QCOM']
  const r2Labels = ['ASML', 'AVGO', 'INTC', 'MSFT', 'AMD']

  function labelAnchor(nx: number): 'start' | 'end' | 'middle' {
    if (nx > cx + 20) return 'start'
    if (nx < cx - 20) return 'end'
    return 'middle'
  }
  function labelDy(ny: number, above: boolean): number {
    return ny < cy ? (above ? -16 : 16) : (above ? -16 : 16)
  }

  return (
    <div className="relative w-full flex flex-col items-center justify-center" style={{ height: 520 }}>
      <svg width="100%" height="100%" viewBox="0 0 500 496" preserveAspectRatio="xMidYMid meet">

        {/* Dashed ring guides */}
        <circle cx={cx} cy={cy} r={r1} fill="none" stroke="#3f3f46" strokeWidth="1" strokeDasharray="5 5" opacity="0.4" />
        <circle cx={cx} cy={cy} r={r2} fill="none" stroke="#3f3f46" strokeWidth="1" strokeDasharray="5 5" opacity="0.25" />

        {/* Center → ring1 spokes */}
        {ring1.map((n, i) => (
          <line key={i} x1={cx} y1={cy} x2={n.x} y2={n.y}
            stroke="#52525b" strokeWidth="1.5" opacity="0.5" />
        ))}

        {/* Ring1 → ring2 spokes */}
        {ring2.map((n, i) => {
          const src = ring1[i % ring1.length]
          return <line key={i} x1={src.x} y1={src.y} x2={n.x} y2={n.y}
            stroke="#3f3f46" strokeWidth="1" opacity="0.35" />
        })}

        {/* Ring 2 nodes */}
        {ring2.map((n, i) => (
          <g key={i}>
            <circle cx={n.x} cy={n.y} r="9" fill="#1c1c1e" stroke="#3f3f46" strokeWidth="1.5" opacity="0.9" />
            <text
              x={n.x + (labelAnchor(n.x) === 'start' ? 14 : labelAnchor(n.x) === 'end' ? -14 : 0)}
              y={n.y + (n.y > cy ? 14 : -14) * (labelAnchor(n.x) === 'middle' ? 1 : 0) + (labelAnchor(n.x) !== 'middle' ? 4 : 0)}
              textAnchor={labelAnchor(n.x)}
              dominantBaseline="middle"
              fill="#52525b" fontSize="9.5" fontFamily="ui-monospace, monospace" letterSpacing="0.05em">
              {r2Labels[i]}
            </text>
          </g>
        ))}

        {/* Ring 1 nodes */}
        {ring1.map((n, i) => (
          <g key={i}>
            <circle cx={n.x} cy={n.y} r="14" fill="#27272a" stroke="#52525b" strokeWidth="1.5" opacity="0.9" />
            <text
              x={n.x + (labelAnchor(n.x) === 'start' ? 19 : labelAnchor(n.x) === 'end' ? -19 : 0)}
              y={n.y + (n.y < cy - 20 ? -20 : 20) * (labelAnchor(n.x) === 'middle' ? 1 : 0) + (labelAnchor(n.x) !== 'middle' ? 4 : 0)}
              textAnchor={labelAnchor(n.x)}
              dominantBaseline="middle"
              fill="#71717a" fontSize="10" fontFamily="ui-monospace, monospace" letterSpacing="0.05em">
              {r1Labels[i]}
            </text>
          </g>
        ))}

        {/* Center node — pulsing blue */}
        <circle cx={cx} cy={cy} r="28" fill="#1c1c1e" stroke="#3b82f6" strokeWidth="2">
          <animate attributeName="r" values="28;32;28" dur="2.4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.8;1;0.8" dur="2.4s" repeatCount="indefinite" />
        </circle>
        <circle cx={cx} cy={cy} r="11" fill="#3b82f6" opacity="0.9" />
        <circle cx={cx} cy={cy} r="5" fill="#eff6ff" />

        {/* Center label */}
        <text x={cx} y={cy + 42} textAnchor="middle"
          fill="#57534e" fontSize="10" fontFamily="ui-monospace, monospace" letterSpacing="0.08em">
          SHOCK
        </text>
      </svg>

      <p className="absolute bottom-4 text-zinc-600 text-xs tracking-widest uppercase">
        Run an analysis to visualize contagion
      </p>
    </div>
  )
}

// ── Portfolio exposure ────────────────────────────────────────────────────────
interface PortfolioHoldingResult {
  inputName: string
  resolvedName: string
  weight: number
  exposure: number
  contribution: number
  isShockCompany: boolean
  inNetwork: boolean
}

interface PortfolioExposure {
  totalIndirect: number
  directWeight: number
  shockCompany: string
  shockPct: number
  breakdown: PortfolioHoldingResult[]
}

function calcPortfolioExposure(results: Results): PortfolioExposure | null {
  const holdings = getHoldings().filter(h => h.company.trim() && (parseFloat(h.weight) || 0) > 0)
  if (holdings.length === 0) return null

  const exposureMap = new Map<string, number>(results.affected.map(a => [a.company, a.exposure]))
  let directWeight = 0

  const breakdown: PortfolioHoldingResult[] = holdings.map(h => {
    const resolvedName = resolveCompany(h.company)
    const weight = (parseFloat(h.weight) || 0) / 100
    const isShockCompany = resolvedName === results.shock_company
    if (isShockCompany) directWeight += weight
    const exposure = isShockCompany ? 0 : (exposureMap.get(resolvedName) ?? 0)
    const inNetwork = isShockCompany || exposureMap.has(resolvedName)
    return { inputName: h.company, resolvedName, weight, exposure, contribution: weight * exposure, isShockCompany, inNetwork }
  })

  const totalIndirect = breakdown.filter(b => !b.isShockCompany).reduce((s, b) => s + b.contribution, 0)
  return {
    totalIndirect,
    directWeight,
    shockCompany: results.shock_company,
    shockPct: results.shock_pct,
    breakdown: [...breakdown].sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution)),
  }
}

function PortfolioExposurePanel({ exposure }: { exposure: PortfolioExposure }) {
  const [expanded, setExpanded] = useState(false)
  const { totalIndirect, directWeight, shockCompany, shockPct, breakdown } = exposure
  const sign = totalIndirect >= 0 ? '+' : ''
  const pct = (totalIndirect * 100).toFixed(2)
  const color = totalIndirect < -0.0005 ? 'text-red-400' : totalIndirect > 0.0005 ? 'text-green-400' : 'text-zinc-400'
  const maxAbs = Math.max(...breakdown.map(b => Math.abs(b.contribution)), 0.0001)

  return (
    <div className="rounded-2xl card-appear" style={{ background: '#18181b', border: '1px solid #27272a' }}>
      <div className="px-6 pt-5 pb-4 border-b border-zinc-800/70 flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <span className="w-1 h-3.5 rounded-full bg-blue-500 opacity-80" />
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Portfolio Exposure</p>
        </div>
        <Link href="/portfolio" className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors flex-shrink-0">
          Edit holdings →
        </Link>
      </div>
      <div className="px-6 py-4 flex flex-col gap-3">
        {/* Headline */}
        <div className="flex items-baseline gap-2">
          <span className={`text-3xl font-black tabular-nums tracking-tight ${color}`}>
            {sign}{pct}%
          </span>
          <span className="text-xs text-zinc-500">indirect portfolio impact</span>
        </div>
        <p className="text-xs text-zinc-500 leading-relaxed -mt-1">
          From <span className="text-zinc-300">{shockCompany}</span> moving{' '}
          <span className={shockPct < 0 ? 'text-red-400' : 'text-green-400'}>
            {shockPct >= 0 ? '+' : ''}{(shockPct * 100).toFixed(0)}%
          </span>
          {' '}through supply chain relationships.
        </p>

        {directWeight > 0 && (
          <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-500/8 border border-amber-500/15">
            <span className="text-amber-400 text-xs mt-0.5">⚠</span>
            <p className="text-xs text-zinc-500 leading-relaxed">
              You hold <span className="text-amber-300 font-semibold">{(directWeight * 100).toFixed(1)}%</span> of {shockCompany} directly — additional{' '}
              <span className={shockPct < 0 ? 'text-red-400 font-semibold' : 'text-green-400 font-semibold'}>
                {((directWeight * shockPct) * 100 >= 0 ? '+' : '')}{(directWeight * shockPct * 100).toFixed(2)}%
              </span>{' '}direct impact not included above.
            </p>
          </div>
        )}

        {/* Breakdown */}
        {expanded && (
          <div className="flex flex-col gap-1 mt-1">
            {breakdown.map((b, i) => {
              const sector = COMPANY_SECTOR[b.resolvedName]
              const sectorColor = sector ? SECTOR_COLORS[sector] : '#52525b'
              const barW = maxAbs > 0 ? Math.abs(b.contribution) / maxAbs * 100 : 0
              return (
                <div key={i} className="flex flex-col gap-1 py-1.5 border-b border-zinc-800/40 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: sectorColor, opacity: b.inNetwork ? 1 : 0.3 }} />
                    <span className={`text-xs flex-1 truncate ${b.inNetwork ? 'text-zinc-300' : 'text-zinc-600'}`}>{b.resolvedName}</span>
                    <span className="text-[10px] text-zinc-600 font-mono">{(b.weight * 100).toFixed(1)}%</span>
                    {b.isShockCompany
                      ? <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400">shock</span>
                      : !b.inNetwork
                        ? <span className="text-[10px] text-zinc-700">—</span>
                        : <span className={`text-[10px] font-mono font-semibold ${b.contribution < 0 ? 'text-red-400' : b.contribution > 0 ? 'text-green-400' : 'text-zinc-600'}`}>
                            {b.contribution >= 0 ? '+' : ''}{(b.contribution * 100).toFixed(3)}%
                          </span>
                    }
                  </div>
                  {!b.isShockCompany && b.inNetwork && (
                    <div className="flex items-center gap-2 pl-3.5">
                      <div className="flex-1 h-0.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${barW}%`, backgroundColor: b.contribution < 0 ? '#f87171' : '#4ade80' }} />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <button
          onClick={() => setExpanded(v => !v)}
          className="self-start text-xs text-zinc-600 hover:text-blue-400 transition-colors underline underline-offset-2"
        >
          {expanded ? 'Show less ↑' : `Show breakdown (${breakdown.length}) →`}
        </button>
      </div>
    </div>
  )
}

export default function Home() {
  const [mode, setMode] = useState<'manual' | 'natural'>(() => getAnalyzeState().mode)

  const [company, setCompany] = useState(() => getAnalyzeState().company)
  const [shockPct, setShockPct] = useState(() => getAnalyzeState().shockPct)

  const [prompt, setPrompt] = useState(() => getAnalyzeState().prompt)
  const [parsedCompany, setParsedCompany] = useState<string | null>(() => getAnalyzeState().parsedCompany)
  const [parsedPct, setParsedPct] = useState<number | null>(() => getAnalyzeState().parsedPct)
  const [reasoning, setReasoning] = useState<string | null>(() => getAnalyzeState().reasoning)

  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Results | null>(() => getAnalyzeState().results)
  const [narrative, setNarrative] = useState<string | null>(() => getAnalyzeState().narrative)
  const [narrativeLoading, setNarrativeLoading] = useState(false)
  const [deepNarrative, setDeepNarrative] = useState<string | null>(() => getAnalyzeState().deepNarrative)
  const [deepNarrativeLoading, setDeepNarrativeLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null)
  const [showCritical, setShowCritical] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [portfolioExposure, setPortfolioExposure] = useState<PortfolioExposure | null>(null)

  // On mount: recalculate portfolio exposure if results exist, or auto-run if company is set
  useEffect(() => {
    const saved = getAnalyzeState()
    if (saved.results) {
      setPortfolioExposure(calcPortfolioExposure(saved.results))
    } else if (saved.company) {
      runAnalysis(saved.company, saved.shockPct)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Persist state across route navigations
  useEffect(() => {
    saveAnalyzeState({ mode, company, shockPct, prompt, parsedCompany, parsedPct, reasoning, results, narrative, deepNarrative })
  }, [mode, company, shockPct, prompt, parsedCompany, parsedPct, reasoning, results, narrative, deepNarrative])

  const criticalResult = useMemo(() => {
    if (!results) return null
    const nodeNames = [results.shock_company, ...results.affected.map(a => a.company)]
    return findCriticalNode(nodeNames, results.edges)
  }, [results])

  async function fetchNarrative(data: Results) {
    setNarrativeLoading(true)
    try {
      const res = await fetch('/api/narrative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shock_company: data.shock_company, shock_pct: data.shock_pct, affected: data.affected }),
      })
      const json = await res.json()
      if (json.narrative) setNarrative(json.narrative)
    } catch {
      // silently fail — graph is already showing
    } finally {
      setNarrativeLoading(false)
    }
  }

  async function handleLearnMore() {
    if (!results || deepNarrativeLoading) return
    setDeepNarrativeLoading(true)
    try {
      const res = await fetch('/api/narrative-deep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shock_company: results.shock_company, shock_pct: results.shock_pct, affected: results.affected, short_narrative: narrative }),
      })
      const json = await res.json()
      if (json.narrative) setDeepNarrative(json.narrative)
    } catch {
      // silently fail
    } finally {
      setDeepNarrativeLoading(false)
    }
  }

  async function runAnalysis(shock_company: string, shock_pct_raw: number) {
    if (!shock_company.trim()) return
    setLoading(true)
    setError(null)
    setNarrative(null)
    setDeepNarrative(null)
    setPortfolioExposure(null)

    const shock_pct = shock_pct_raw / 100

    try {
      const res = await fetch('/api/contagion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shock_company: shock_company.trim(), shock_pct }),
      })

      let data: Record<string, unknown>
      try { data = await res.json() } catch { throw new Error(`Server error (${res.status})`) }
      if (!res.ok) throw new Error((data.error as string) ?? `Request failed (${res.status})`)

      const graphData = data as unknown as Results
      setResults(graphData)
      fetchNarrative(graphData)
      setPortfolioExposure(calcPortfolioExposure(graphData))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col">

      {/* ── Top hairline ── */}
      <div
        className="hairline-breathe fixed top-0 left-0 right-0 z-50 pointer-events-none"
        style={{ height: 1, background: 'linear-gradient(90deg, transparent 0%, rgba(59,130,246,0.35) 20%, rgba(59,130,246,0.85) 50%, rgba(59,130,246,0.35) 80%, transparent 100%)' }}
      />

      {/* Ambient */}
      <div className="pointer-events-none fixed inset-0" style={{ zIndex: 0, background: 'radial-gradient(ellipse 60% 45% at 50% 20%, rgba(59,130,246,0.06) 0%, transparent 70%)' }} />

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-20 flex items-center justify-between px-8 py-4 shrink-0 border-b border-zinc-800/50 backdrop-blur-md"
        style={{ background: 'rgba(0,0,0,0.85)', boxShadow: '0 1px 0 rgba(59,130,246,0.06), 0 4px 20px rgba(0,0,0,0.5)' }}>
        <Link href="/" className="flex items-center gap-2.5 group">
          <TremorIcon />
          <span className="text-base font-black tracking-tight text-zinc-100">TREMOR</span>
        </Link>
        <div className="flex items-center gap-5">
          <button onClick={() => setShowHelp(true)} className="w-7 h-7 flex items-center justify-center rounded-full border border-zinc-700 text-zinc-400 hover:text-zinc-100 hover:border-zinc-500 text-xs font-bold transition-colors bg-zinc-800/50">?</button>
          <Link href="/portfolio" className="text-xs font-medium text-zinc-500 hover:text-zinc-200 transition-colors">Portfolio</Link>
          <Link href="/shock" className="text-xs font-medium text-zinc-500 hover:text-zinc-200 transition-colors">Shock</Link>
          <Link href="/explore" className="text-xs font-medium text-zinc-500 hover:text-zinc-200 transition-colors">Explore</Link>
          <span className="text-xs font-semibold text-zinc-100">Analysis</span>
        </div>
      </nav>

      {/* Body */}
      <div className="relative z-10 flex flex-col lg:flex-row gap-5 flex-1 p-6 lg:p-8 pt-5">

        {/* Left — graph + breakdowns */}
        <div className="lg:w-1/2 flex flex-col gap-4 lg:sticky lg:top-[73px] lg:self-start">
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: '#111114', border: '1px solid rgba(59,130,246,0.1)', boxShadow: '0 0 0 1px rgba(255,255,255,0.02) inset, 0 8px 40px rgba(0,0,0,0.6)' }}
          >
            {results ? (
              <div className="graph-appear">
                <ContagionGraph
                  shockCompany={results.shock_company}
                  shockPct={results.shock_pct}
                  affected={results.affected}
                  edges={results.edges ?? []}
                  onNodeClick={setSelectedCompany}
                  criticalNode={showCritical ? criticalResult?.node ?? null : null}
                />
              </div>
            ) : (
              <PlaceholderGraph />
            )}
          </div>
          {/* Critical Node toggle — only shown when results exist */}
          {results && (
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setShowCritical(v => !v)}
                disabled={!criticalResult}
                className={`flex items-center gap-1.5 self-start px-3 py-1.5 rounded-xl text-xs font-medium border transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                  showCritical
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                    : 'border-zinc-700/50 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 bg-zinc-800/60'
                }`}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M6 1l1.2 3.6H11L8.4 6.8l.9 3.4L6 8.4 2.7 10.2l.9-3.4L1 4.6h3.8L6 1z" fill="currentColor" opacity="0.9"/>
                </svg>
                Critical Node
                {showCritical && criticalResult && (
                  <span className="ml-0.5 text-amber-200 font-semibold">{criticalResult.node}</span>
                )}
              </button>
              {showCritical && criticalResult && (
                <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-amber-500/8 border border-amber-500/20">
                  <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                  <p className="text-xs text-amber-200/80">
                    <span className="font-semibold text-amber-300">{criticalResult.node}</span>
                    {' '}is the most structurally critical node — removing it would disconnect{' '}
                    <span className="font-semibold text-amber-300">{criticalResult.disconnects} {criticalResult.disconnects === 1 ? 'company' : 'companies'}</span>
                    {' '}from the rest of this subgraph.
                  </p>
                </div>
              )}
            </div>
          )}
          <SectorBreakdown affected={results?.affected ?? []} />
          {results && (
            <NarrativeBox
              narrative={narrative}
              loading={narrativeLoading}
              deepNarrative={deepNarrative}
              deepLoading={deepNarrativeLoading}
              onLearnMore={handleLearnMore}
            />
          )}
        </div>

        {/* Right — results */}
        <div className="lg:w-1/2 flex flex-col gap-4">

          {/* Scenario card */}
          <div className="rounded-2xl px-5 py-3.5 flex items-center justify-between gap-4"
            style={{ background: 'linear-gradient(135deg, #18181b, #141416)', border: '1px solid rgba(59,130,246,0.12)', boxShadow: '0 1px 0 rgba(255,255,255,0.03) inset, 0 2px 12px rgba(0,0,0,0.5)' }}>
            {results || loading ? (
              <>
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-1 h-3.5 rounded-full bg-blue-500 opacity-80 flex-shrink-0" />
                  <span className="text-sm font-semibold text-zinc-100 truncate">{results?.shock_company ?? company}</span>
                  <span className={`text-sm font-mono font-semibold flex-shrink-0 ${(results?.shock_pct ?? shockPct / 100) < 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {((results?.shock_pct ?? shockPct / 100) >= 0 ? '+' : '')}{((results?.shock_pct ?? shockPct / 100) * 100).toFixed(0)}%
                  </span>
                  {loading && <span className="w-3.5 h-3.5 border-2 border-zinc-700 border-t-blue-400 rounded-full animate-spin flex-shrink-0" />}
                </div>
                <Link href="/shock" className="text-xs text-zinc-600 hover:text-zinc-300 transition-colors flex-shrink-0">Change →</Link>
              </>
            ) : (
              <div className="flex items-center justify-between w-full">
                <span className="text-xs text-zinc-600">No scenario configured</span>
                <Link href="/shock" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">Configure →</Link>
              </div>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">{error}</p>
          )}

          <AffectedPanel
            shockCompany={results?.shock_company ?? ''}
            affected={results?.affected ?? []}
            edges={results?.edges ?? []}
          />
          {portfolioExposure && <PortfolioExposurePanel exposure={portfolioExposure} />}
        </div>
      </div>

      <CompanyDrawer
        company={selectedCompany}
        exposure={results?.affected.find(a => a.company === selectedCompany)?.exposure ?? null}
        onClose={() => setSelectedCompany(null)}
        onCompanyClick={setSelectedCompany}
      />

      {/* Help modal */}
      {showHelp && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setShowHelp(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none">
            <div
              className="w-full max-w-lg pointer-events-auto rounded-2xl border border-zinc-700/60 shadow-2xl overflow-hidden"
              style={{ background: 'linear-gradient(160deg, #1c1c1f, #141416)' }}
            >
              <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-zinc-800">
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-0.5">Guide</p>
                  <h2 className="text-lg font-black tracking-tight text-zinc-100">How to use Analysis</h2>
                </div>
                <button onClick={() => setShowHelp(false)} className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
              <div className="px-6 py-5 flex flex-col gap-5 max-h-[70vh] overflow-y-auto">
                {ANALYZE_HELP.map(section => (
                  <div key={section.title}>
                    <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-2.5">{section.title}</p>
                    <div className="flex flex-col gap-2">
                      {section.items.map(item => (
                        <div key={item.label} className="flex gap-3">
                          <span className="text-xs font-semibold text-zinc-300 shrink-0 w-28 pt-0.5">{item.label}</span>
                          <span className="text-xs text-zinc-500 leading-relaxed">{item.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-6 py-3 border-t border-zinc-800">
                <p className="text-[10px] text-zinc-600 text-center">Click anywhere outside to close</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
