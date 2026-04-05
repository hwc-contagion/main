'use client'

import { useEffect, useState, useRef } from 'react'
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

export default function ExplorePage() {
  const [nodes, setNodes] = useState<GraphNode[]>([])
  const [edges, setEdges] = useState<GraphEdge[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<string | null>(null)

  // Debounced highlight — only highlight once user stops typing
  const [highlighted, setHighlighted] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    fetch('/api/graph')
      .then(r => r.json())
      .then(data => { setNodes(data.nodes); setEdges(data.edges) })
      .catch(() => setError('Failed to load graph'))
      .finally(() => setLoading(false))
  }, [])

  function handleSearchChange(val: string) {
    setSearch(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!val.trim()) { setHighlighted(null); return }
    debounceRef.current = setTimeout(() => {
      const match = nodes.find(n =>
        n.name.toLowerCase().includes(val.toLowerCase())
      )
      setHighlighted(match?.name ?? null)
    }, 200)
  }

  const sectorsPresent = SECTOR_ORDER.filter(s =>
    nodes.some(n => COMPANY_SECTOR[n.name] === s)
  )

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
        <div className="flex items-center gap-1 bg-zinc-800/50 border border-zinc-700/40 rounded-xl p-1">
          <Link
            href="/analyze"
            className="px-3.5 py-1.5 text-xs font-medium rounded-lg text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Analysis
          </Link>
          <span className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-zinc-700 text-zinc-100">
            Explore
          </span>
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
              className="pl-8 pr-4 py-1.5 text-xs bg-zinc-800/60 border border-zinc-700/60 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all w-48"
            />
            {highlighted && (
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-blue-400">{highlighted}</span>
            )}
          </div>

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
                  style={active ? { backgroundColor: SECTOR_COLORS[sector], borderColor: SECTOR_COLORS[sector] } : {}}
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
              <button
                onClick={() => setActiveFilter(null)}
                className="px-2 py-1 text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                clear
              </button>
            )}
          </div>
        </div>

        {/* Graph card */}
        <div
          className="rounded-2xl overflow-hidden flex-1"
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
              onNodeClick={setSelectedCompany}
              highlightCompany={highlighted}
              activeFilter={activeFilter}
            />
          )}
        </div>
      </div>

      <CompanyDrawer
        company={selectedCompany}
        onClose={() => setSelectedCompany(null)}
        onCompanyClick={setSelectedCompany}
      />
    </div>
  )
}
