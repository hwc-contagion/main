'use client'

import { useEffect, useState } from 'react'
import { sectorBadge } from '@/lib/sectors'
import { COMPANY_DESCRIPTIONS } from '@/lib/descriptions'

interface Neighbor {
  name: string
  weight: number
}

interface Profile {
  name: string
  suppliers: Neighbor[]
  customers: Neighbor[]
}

function WeightBar({ weight }: { weight: number }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="h-1 flex-1 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-zinc-500 transition-all"
          style={{ width: `${Math.round(weight * 100)}%` }}
        />
      </div>
      <span className="text-[10px] font-mono text-zinc-500 tabular-nums w-8 text-right flex-shrink-0">
        {(weight * 100).toFixed(0)}%
      </span>
    </div>
  )
}

function NeighborRow({ n, onClick }: { n: Neighbor; onClick: (name: string) => void }) {
  const badge = sectorBadge(n.name)
  return (
    <li
      className="flex flex-col gap-1 py-2 border-b border-zinc-800/60 last:border-0 cursor-pointer group"
      onClick={() => onClick(n.name)}
    >
      <div className="flex items-center gap-2 min-w-0">
        {badge && (
          <span
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: badge.color }}
          />
        )}
        <span className="text-sm text-zinc-200 font-medium truncate group-hover:text-zinc-100 transition-colors">
          {n.name}
        </span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="ml-auto flex-shrink-0 text-zinc-600 group-hover:text-zinc-400 transition-colors">
          <path d="M2 5h6M5 2l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <WeightBar weight={n.weight} />
    </li>
  )
}

interface Props {
  company: string | null
  exposure?: number | null
  onClose: () => void
  onCompanyClick?: (company: string) => void
}

export default function CompanyDrawer({ company, exposure, onClose, onCompanyClick }: Props) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const open = company !== null

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (!company) { setProfile(null); return }
    setLoading(true)
    setError(null)
    setProfile(null)
    fetch(`/api/company/${encodeURIComponent(company)}`)
      .then(r => r.json())
      .then((data: Profile & { error?: string }) => {
        if (data.error) throw new Error(data.error)
        setProfile(data)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [company])

  const badge = company ? sectorBadge(company) : null
  const hasExposure = exposure != null && exposure !== 0

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-200 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        style={{ background: 'rgba(0,0,0,0.4)' }}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full z-50 flex flex-col bg-zinc-900 border-l border-zinc-800 shadow-2xl transition-transform duration-300 ease-out`}
        style={{
          width: 340,
          transform: open ? 'translateX(0)' : 'translateX(100%)',
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-zinc-800 flex-shrink-0">
          <div className="flex flex-col gap-1.5 min-w-0 pr-3">
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Company profile</p>
            <h2 className="text-xl font-black tracking-tight text-zinc-100 leading-tight truncate">
              {company ?? '—'}
            </h2>
            <div className="flex items-center gap-2 flex-wrap">
              {badge && (
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: badge.color + '22', color: badge.color }}
                >
                  {badge.sector}
                </span>
              )}
              {hasExposure && (
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${(exposure ?? 0) < 0 ? 'bg-red-500/15 text-red-400' : 'bg-green-500/15 text-green-400'}`}
                >
                  {(exposure ?? 0) >= 0 ? '+' : ''}{((exposure ?? 0) * 100).toFixed(1)}% exposure
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5">
          {loading && (
            <div className="flex-1 flex items-center justify-center">
              <span className="w-5 h-5 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin" />
            </div>
          )}

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Description — shown as soon as we know the company name */}
          {company && COMPANY_DESCRIPTIONS[company] && (
            <p className="text-xs text-zinc-400 leading-relaxed">
              {COMPANY_DESCRIPTIONS[company]}
            </p>
          )}

          {profile && (
            <>
              {/* Suppliers */}
              <section>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">
                    Suppliers
                  </span>
                  <span className="text-[10px] text-zinc-600">
                    {profile.suppliers.length}
                  </span>
                </div>
                {profile.suppliers.length === 0 ? (
                  <p className="text-xs text-zinc-600 italic">None on record</p>
                ) : (
                  <ul className="divide-y-0">
                    {profile.suppliers.map(n => <NeighborRow key={n.name} n={n} onClick={name => onCompanyClick?.(name)} />)}
                  </ul>
                )}
              </section>

              {/* Customers */}
              <section>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">
                    Customers
                  </span>
                  <span className="text-[10px] text-zinc-600">
                    {profile.customers.length}
                  </span>
                </div>
                {profile.customers.length === 0 ? (
                  <p className="text-xs text-zinc-600 italic">None on record</p>
                ) : (
                  <ul className="divide-y-0">
                    {profile.customers.map(n => <NeighborRow key={n.name} n={n} onClick={name => onCompanyClick?.(name)} />)}
                  </ul>
                )}
              </section>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-zinc-800 flex-shrink-0">
          <p className="text-[10px] text-zinc-600 text-center">
            Supply chain data · Neo4j graph
          </p>
        </div>
      </div>
    </>
  )
}
