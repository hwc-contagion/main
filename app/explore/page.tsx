'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import Link from 'next/link'
import ExploreGraph from '../components/ExploreGraph'
import CompanyDrawer from '../components/CompanyDrawer'
import { SECTOR_COLORS, SECTOR_ORDER, COMPANY_SECTOR } from '@/lib/sectors'

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

interface GraphNode { name: string }
interface GraphEdge { from: string; to: string; rel_type: string; weight: number }

// ── Critical node algorithm ────────────────────────────────────────────────────
// For each node, remove it from the graph and measure how many remaining nodes
// fall outside the largest connected component. The node with the highest
// "disconnection impact" is the most critical structural dependency.
function findCriticalNode(
  nodes: GraphNode[],
  edges: GraphEdge[],
): { node: string; disconnects: number } | null {
  if (nodes.length < 3) return null

  // Undirected adjacency (supply chain connectivity ignores direction)
  const adj = new Map<string, string[]>()
  nodes.forEach(n => adj.set(n.name, []))
  edges.forEach(e => {
    adj.get(e.from)?.push(e.to)
    adj.get(e.to)?.push(e.from)
  })

  // Returns the size of the largest connected component after excluding `excluded`
  function largestComponent(excluded: string): number {
    const remaining = nodes.filter(n => n.name !== excluded)
    if (!remaining.length) return 0
    const visited = new Set<string>()
    let largest = 0
    for (const { name: start } of remaining) {
      if (visited.has(start)) continue
      const component = new Set([start])
      const queue = [start]
      while (queue.length) {
        const curr = queue.shift()!
        for (const nb of adj.get(curr) ?? []) {
          if (nb !== excluded && !component.has(nb)) {
            component.add(nb)
            queue.push(nb)
          }
        }
      }
      component.forEach(n => visited.add(n))
      largest = Math.max(largest, component.size)
    }
    return largest
  }

  const N = nodes.length
  let best = { node: '', disconnects: 0 }

  for (const { name } of nodes) {
    const largest = largestComponent(name)
    const disconnects = (N - 1) - largest  // nodes not in the main cluster after removal
    if (disconnects > best.disconnects) best = { node: name, disconnects }
  }

  return best.disconnects > 0 ? best : null
}

// ── Help content ───────────────────────────────────────────────────────────────
const HELP_SECTIONS = [
  {
    title: 'Navigating the graph',
    items: [
      { label: 'Zoom', desc: 'Scroll to zoom in and out. Company names appear as you zoom in.' },
      { label: 'Pan', desc: 'Click and drag on empty space to pan around the network.' },
      { label: 'Click a node', desc: 'Opens a company profile showing its direct suppliers and customers.' },
    ],
  },
  {
    title: 'Reading the nodes',
    items: [
      { label: 'Node size', desc: 'Larger nodes have more supply chain connections — they are bigger hubs in the network.' },
      { label: 'Ring color', desc: 'Each industry sector has a unique color. The ring around each node shows which sector it belongs to.' },
      { label: 'Edge color', desc: 'Edges inherit the color of their source company\'s sector, so you can trace supply flows by industry.' },
      { label: 'Edge direction', desc: 'Arrows point from supplier → customer, showing the direction of supply.' },
    ],
  },
  {
    title: 'Filters & tools',
    items: [
      { label: 'Sector chips', desc: 'Click any sector chip to isolate that industry — other nodes and edges fade out so you can focus on one cluster.' },
      { label: 'Search', desc: 'Type a company name to find and highlight it in the graph with a white ring.' },
      { label: 'Critical Node', desc: 'Runs a graph connectivity algorithm to find the single company whose removal would disconnect the most others from the network. Highlighted in amber — this is the supply chain\'s most vulnerable structural dependency.' },
    ],
  },
]

// ── Component ──────────────────────────────────────────────────────────────────
export default function ExplorePage() {
  const [nodes, setNodes]               = useState<GraphNode[]>([])
  const [edges, setEdges]               = useState<GraphEdge[]>([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState<string | null>(null)
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null)
  const [search, setSearch]             = useState('')
  const [highlighted, setHighlighted]   = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [showCritical, setShowCritical] = useState(false)
  const [showHelp, setShowHelp]         = useState(false)
  const [zoomReset, setZoomReset]       = useState(0)
  const debounceRef    = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchOpenedRef = useRef(false)

  useEffect(() => {
    fetch('/api/graph')
      .then(r => r.json())
      .then(data => { setNodes(data.nodes); setEdges(data.edges) })
      .catch(() => setError('Failed to load graph'))
      .finally(() => setLoading(false))
  }, [])

  const criticalResult = useMemo(
    () => (nodes.length > 0 ? findCriticalNode(nodes, edges) : null),
    [nodes, edges],
  )

  function handleSearchChange(val: string) {
    setSearch(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!val.trim()) { setHighlighted(null); return }
    debounceRef.current = setTimeout(() => {
      const match = nodes.find(n => n.name.toLowerCase().includes(val.toLowerCase()))
      setHighlighted(match?.name ?? null)
      if (match) { searchOpenedRef.current = true; setSelectedCompany(match.name) }
    }, 200)
  }

  const sectorsPresent = SECTOR_ORDER.filter(s => nodes.some(n => COMPANY_SECTOR[n.name] === s))

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">

      {/* Hairline */}
      <div
        className="hairline-breathe fixed top-0 left-0 right-0 z-50 pointer-events-none"
        style={{ height: 1, background: 'linear-gradient(90deg, transparent 0%, rgba(59,130,246,0.45) 20%, rgba(59,130,246,0.85) 50%, rgba(59,130,246,0.45) 80%, transparent 100%)' }}
      />

      {/* Ambient glows */}
      <div className="pointer-events-none fixed inset-0" style={{ zIndex: 0, background: 'radial-gradient(ellipse 60% 65% at 26% 52%, rgba(59,130,246,0.08) 0%, transparent 65%)' }} />
      <div className="pointer-events-none fixed inset-0" style={{ zIndex: 0, background: 'radial-gradient(ellipse 50% 40% at 84% 80%, rgba(96,165,250,0.04) 0%, transparent 60%)' }} />

      {/* Nav */}
      <nav className="sticky top-0 z-20 flex items-center justify-between px-8 py-4 shrink-0 border-b border-zinc-800/60 backdrop-blur-md bg-zinc-950/75">
        <Link href="/" className="flex items-center gap-2.5">
          <TremorIcon />
          <span className="text-base font-black tracking-tight text-zinc-100">TREMOR</span>
        </Link>
        <div className="flex items-center gap-5">
          <button onClick={() => setShowHelp(true)} className="w-7 h-7 flex items-center justify-center rounded-full border border-zinc-700 text-zinc-400 hover:text-zinc-100 hover:border-zinc-500 text-xs font-bold transition-colors bg-zinc-800/50">?</button>
          <Link href="/portfolio" className="text-xs font-medium text-zinc-500 hover:text-zinc-200 transition-colors">Portfolio</Link>
          <Link href="/shock" className="text-xs font-medium text-zinc-500 hover:text-zinc-200 transition-colors">Shock</Link>
          <span className="text-xs font-semibold text-zinc-100">Explore</span>
          <Link href="/analyze" className="text-xs font-medium text-zinc-500 hover:text-zinc-200 transition-colors">Analysis</Link>
        </div>
      </nav>

      {/* Body */}
      <div className="relative z-10 flex flex-col gap-4 flex-1 p-6 lg:p-8 pt-5">

        {/* Controls row */}
        <div className="flex flex-wrap items-center gap-3">

          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" width="13" height="13" viewBox="0 0 13 13" fill="none">
              <circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M9 9l2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              placeholder="Find a company…"
              value={search}
              onChange={e => handleSearchChange(e.target.value)}
              className="pl-8 pr-4 py-1.5 text-xs bg-zinc-800/60 border border-zinc-700/60 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all w-44"
            />
            {highlighted && (
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-blue-400 pointer-events-none">{highlighted}</span>
            )}
          </div>

          {/* Critical Node toggle */}
          <button
            onClick={() => setShowCritical(v => !v)}
            disabled={!criticalResult}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
              showCritical
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                : 'border-zinc-700/50 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 bg-zinc-800/40'
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

          {/* Sector filter chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            {sectorsPresent.map(sector => {
              const active = activeFilter === sector
              return (
                <button
                  key={sector}
                  onClick={() => setActiveFilter(active ? null : sector)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all ${
                    active
                      ? 'border-transparent text-zinc-900'
                      : 'border-zinc-700/50 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 bg-zinc-800/40'
                  }`}
                  style={active ? { backgroundColor: SECTOR_COLORS[sector] } : {}}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: active ? 'rgba(0,0,0,0.35)' : SECTOR_COLORS[sector] }}
                  />
                  {sector}
                </button>
              )
            })}
            {activeFilter && (
              <button onClick={() => setActiveFilter(null)} className="px-2 py-1 text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors">
                clear
              </button>
            )}
          </div>
        </div>

        {/* Graph card */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(160deg, #1c1c1f, #141416)',
            boxShadow: '0 0 0 1px rgba(59,130,246,0.12), 0 0 60px rgba(59,130,246,0.06), 0 24px 64px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.04)',
          }}
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3" style={{ height: 680 }}>
              <span className="w-6 h-6 border-2 border-zinc-700 border-t-blue-400 rounded-full animate-spin" />
              <p className="text-xs text-zinc-600 uppercase tracking-widest">Loading supply chain graph…</p>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center" style={{ height: 680 }}>
              <p className="text-sm text-red-400">{error}</p>
            </div>
          ) : (
            <ExploreGraph
              nodes={nodes}
              edges={edges}
              onNodeClick={company => { searchOpenedRef.current = false; setSelectedCompany(company) }}
              highlightCompany={highlighted}
              activeFilter={activeFilter}
              criticalNode={showCritical ? criticalResult?.node ?? null : null}
              focusCompany={highlighted}
              zoomResetTrigger={zoomReset}
            />
          )}
        </div>

        {/* Critical node info banner */}
        {showCritical && criticalResult && (
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-amber-500/8 border border-amber-500/20">
            <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
            <p className="text-xs text-amber-200/80">
              <span className="font-semibold text-amber-300">{criticalResult.node}</span>
              {' '}is the most critical node — removing it would disconnect{' '}
              <span className="font-semibold text-amber-300">{criticalResult.disconnects} other {criticalResult.disconnects === 1 ? 'company' : 'companies'}</span>
              {' '}from the main supply chain network.
            </p>
          </div>
        )}
      </div>

      {/* Company drawer */}
      <CompanyDrawer
        company={selectedCompany}
        onClose={() => {
          if (searchOpenedRef.current) {
            searchOpenedRef.current = false
            setZoomReset(n => n + 1)
          }
          setSelectedCompany(null)
        }}
        onCompanyClick={company => { searchOpenedRef.current = false; setSelectedCompany(company) }}
      />

      {/* Help modal */}
      {showHelp && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowHelp(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none">
            <div
              className="w-full max-w-lg pointer-events-auto rounded-2xl border border-zinc-700/60 shadow-2xl overflow-hidden"
              style={{ background: 'linear-gradient(160deg, #1c1c1f, #141416)' }}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-zinc-800">
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-0.5">Guide</p>
                  <h2 className="text-lg font-black tracking-tight text-zinc-100">How to use Explore</h2>
                </div>
                <button
                  onClick={() => setShowHelp(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>

              {/* Modal body */}
              <div className="px-6 py-5 flex flex-col gap-5 max-h-[70vh] overflow-y-auto">
                {HELP_SECTIONS.map(section => (
                  <div key={section.title}>
                    <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-2.5">
                      {section.title}
                    </p>
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

              {/* Modal footer */}
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
