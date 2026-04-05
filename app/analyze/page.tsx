'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import AffectedPanel from '../components/AffectedPanel'
import NarrativeBox from '../components/NarrativeBox'
import ContagionGraph from '../components/ContagionGraph'
import SectorBreakdown from '../components/SectorBreakdown'
import CompanyDrawer from '../components/CompanyDrawer'

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

interface Results {
  shock_company: string
  shock_pct: number
  affected: AffectedCompany[]
  edges: Edge[]
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
    title: 'Running an analysis',
    items: [
      { label: 'Manual mode', desc: 'Enter a company name and drag the slider to set the earnings shock (negative = miss, positive = beat).' },
      { label: 'Natural language', desc: 'Describe a hypothetical event in plain English — the AI parses the company and estimated shock magnitude.' },
      { label: 'Run Analysis', desc: 'Executes the contagion model and propagates the shock through the supply chain graph up to 3 hops.' },
    ],
  },
  {
    title: 'Reading the graph',
    items: [
      { label: 'Node size', desc: 'Reflects earnings exposure magnitude — larger nodes are more affected by the shock.' },
      { label: 'Ring color', desc: 'Each industry sector has a unique color shown as a ring around the node.' },
      { label: 'Red / green', desc: 'Red nodes have negative exposure (hurt by the shock), green nodes benefit.' },
      { label: 'Show slider', desc: 'Top-right slider controls how many companies are visible in the graph at once.' },
      { label: 'Click a node', desc: 'Opens a company profile with its full supplier and customer list.' },
    ],
  },
  {
    title: 'Panels',
    items: [
      { label: 'Sector Exposure', desc: 'Average exposure per company, broken down by industry sector.' },
      { label: 'Affected Companies', desc: 'Full ranked list of impacted companies with their supply chain path from the shock origin.' },
      { label: 'Critical Node', desc: 'When toggled on, highlights the company in the current result set whose removal would disconnect the most others — the most structurally important node in the visible graph.' },
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

export default function Home() {
  const [mode, setMode] = useState<'manual' | 'natural'>('manual')

  const [company, setCompany] = useState('')
  const [shockPct, setShockPct] = useState(0)

  const [prompt, setPrompt] = useState('')
  const [parsedCompany, setParsedCompany] = useState<string | null>(null)
  const [parsedPct, setParsedPct] = useState<number | null>(null)
  const [reasoning, setReasoning] = useState<string | null>(null)

  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Results | null>(null)
  const [narrative, setNarrative] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null)
  const [showCritical, setShowCritical] = useState(false)
  const [showHelp, setShowHelp] = useState(false)

  const criticalResult = useMemo(() => {
    if (!results) return null
    const nodeNames = [results.shock_company, ...results.affected.map(a => a.company)]
    return findCriticalNode(nodeNames, results.edges)
  }, [results])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setParsedCompany(null)
    setParsedPct(null)
    setReasoning(null)

    try {
      let shock_company: string
      let shock_pct: number

      if (mode === 'natural') {
        if (!prompt.trim()) return
        const parseRes = await fetch('/api/parse-shock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: prompt.trim() }),
        })
        const parseData = await parseRes.json()
        if (!parseRes.ok) throw new Error(parseData.error ?? 'Failed to parse prompt')
        shock_company = parseData.shock_company
        shock_pct = parseData.shock_pct
        setParsedCompany(shock_company)
        setParsedPct(shock_pct)
        setReasoning(parseData.reasoning ?? null)
      } else {
        if (!company.trim()) return
        shock_company = company.trim()
        shock_pct = shockPct / 100
      }

      const res = await fetch('/api/contagion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shock_company, shock_pct }),
      })

      let data: Record<string, unknown>
      try {
        data = await res.json()
      } catch {
        throw new Error(`Server error (${res.status})`)
      }

      if (!res.ok) {
        throw new Error((data.error as string) ?? `Request failed (${res.status})`)
      }

      setResults(data as unknown as Results)
      setNarrative((data.narrative as string) ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const canSubmit = mode === 'natural' ? prompt.trim().length > 0 : company.trim().length > 0

  const shockColor =
    shockPct > 0 ? 'text-green-400' :
    shockPct < 0 ? 'text-red-400' :
    'text-zinc-500'

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">

      {/* ── Top hairline ── */}
      <div
        className="hairline-breathe fixed top-0 left-0 right-0 z-50 pointer-events-none"
        style={{ height: 1, background: 'linear-gradient(90deg, transparent 0%, rgba(59,130,246,0.45) 20%, rgba(59,130,246,0.85) 50%, rgba(59,130,246,0.45) 80%, transparent 100%)' }}
      />

      {/* ── Ambient glows — static, no animation ── */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{ zIndex: 0, background: 'radial-gradient(ellipse 60% 65% at 26% 52%, rgba(59,130,246,0.10) 0%, transparent 65%)' }}
      />
      <div
        className="pointer-events-none fixed inset-0"
        style={{ zIndex: 0, background: 'radial-gradient(ellipse 50% 40% at 84% 80%, rgba(96,165,250,0.055) 0%, transparent 60%)' }}
      />
      <div
        className="pointer-events-none fixed inset-0"
        style={{ zIndex: 0, background: 'radial-gradient(ellipse 35% 30% at 90% 10%, rgba(167,139,250,0.04) 0%, transparent 55%)' }}
      />

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-20 flex items-center justify-between px-8 py-4 shrink-0 border-b border-zinc-800/60 backdrop-blur-md bg-zinc-950/75">
        <Link href="/" className="flex items-center gap-2.5 group">
          <TremorIcon />
          <span className="text-base font-black tracking-tight text-zinc-100">TREMOR</span>
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowHelp(true)}
            className="w-7 h-7 flex items-center justify-center rounded-full border border-zinc-700 text-zinc-400 hover:text-zinc-100 hover:border-zinc-500 text-xs font-bold transition-colors bg-zinc-800/50"
          >
            ?
          </button>
          <div className="flex items-center gap-1 bg-zinc-800/50 border border-zinc-700/40 rounded-xl p-1">
            <span className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-zinc-700 text-zinc-100">
              Analysis
            </span>
            <Link href="/explore" className="px-3.5 py-1.5 text-xs font-medium rounded-lg text-zinc-400 hover:text-zinc-200 transition-colors">
              Explore
            </Link>
          </div>
        </div>
      </nav>

      {/* Body */}
      <div className="relative z-10 flex flex-col lg:flex-row gap-5 flex-1 p-6 lg:p-8 pt-5">

        {/* Left — graph + breakdowns */}
        <div className="lg:w-1/2 flex flex-col gap-4 lg:sticky lg:top-[73px] lg:self-start">
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: 'linear-gradient(160deg, #1c1c1f, #141416)', boxShadow: '0 0 0 1px rgba(59,130,246,0.12), 0 0 60px rgba(59,130,246,0.07), 0 24px 64px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.04)' }}
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
          {narrative && <NarrativeBox narrative={narrative} />}
        </div>

        {/* Right — controls + results */}
        <div className="lg:w-1/2 flex flex-col gap-4">

          {/* Form card */}
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-5 rounded-2xl overflow-hidden"
            style={{ background: 'linear-gradient(160deg, #1c1c1f, #141416)', boxShadow: '0 0 0 1px rgba(255,255,255,0.06), 0 16px 48px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05)' }}
          >
            {/* Card header strip */}
            <div className="px-6 pt-5 pb-4 border-b border-zinc-800/70 flex items-center gap-2.5">
              <span className="w-1 h-3.5 rounded-full bg-blue-500 opacity-80" />
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Configure shock</p>
            </div>

            <div className="px-6 pb-6 flex flex-col gap-5">
              {/* Mode toggle */}
              <div className="flex rounded-xl overflow-hidden border border-zinc-700/50 text-sm font-medium bg-zinc-800/50">
                <button
                  type="button"
                  onClick={() => setMode('manual')}
                  className={`flex-1 py-2.5 transition-all duration-150 ${mode === 'manual'
                    ? 'bg-zinc-100 text-zinc-900 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'}`}
                >
                  Manual
                </button>
                <button
                  type="button"
                  onClick={() => setMode('natural')}
                  className={`flex-1 py-2.5 transition-all duration-150 ${mode === 'natural'
                    ? 'bg-zinc-100 text-zinc-900 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'}`}
                >
                  Natural Language
                </button>
              </div>

              {mode === 'manual' ? (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="company" className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
                      Company
                    </label>
                    <input
                      id="company"
                      type="text"
                      placeholder="e.g. Apple, Boeing, Tesla"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-4 py-3 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all text-sm"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor="shock" className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
                      Earnings shock —{' '}
                      <span className={`font-bold normal-case ${shockColor}`}>
                        {shockPct > 0 ? '+' : ''}{shockPct}%
                      </span>
                    </label>
                    <input
                      id="shock"
                      type="range"
                      min={-100}
                      max={100}
                      value={shockPct}
                      onChange={(e) => setShockPct(Number(e.target.value))}
                      className="accent-blue-500"
                    />
                    <div className="flex justify-between text-xs text-zinc-600">
                      <span>−100%</span>
                      <span>0</span>
                      <span>+100%</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="prompt" className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
                    Describe the event
                  </label>
                  <textarea
                    id="prompt"
                    rows={3}
                    placeholder="e.g. An earthquake destroyed Apple's main factory in Taiwan"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-4 py-3 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all resize-none text-sm"
                  />
                  {parsedCompany !== null && parsedPct !== null && (
                    <div className="text-xs bg-zinc-800/60 border border-zinc-700/50 rounded-xl px-4 py-3 flex flex-col gap-1">
                      <div>
                        <span className="text-zinc-500">Parsed: </span>
                        <span className="text-zinc-100 font-semibold">{parsedCompany}</span>
                        {' '}
                        <span className={`font-mono font-semibold ${parsedPct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {parsedPct >= 0 ? '+' : ''}{(parsedPct * 100).toFixed(0)}%
                        </span>
                      </div>
                      {reasoning && <p className="text-zinc-500">{reasoning}</p>}
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !canSubmit}
                className="bg-blue-500 hover:bg-blue-400 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed transition-colors rounded-xl px-6 py-3 font-semibold text-sm text-white"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-blue-300/30 border-t-blue-200 rounded-full animate-spin" />
                    Analyzing…
                  </span>
                ) : 'Run Analysis'}
              </button>

              {error && (
                <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
              )}
            </div>
          </form>

          <AffectedPanel
            shockCompany={results?.shock_company ?? ''}
            affected={results?.affected ?? []}
            edges={results?.edges ?? []}
          />
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
