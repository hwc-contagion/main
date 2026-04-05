'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getHoldings, setHoldings, nextHoldingId } from '@/lib/portfolioStore'
import type { Holding } from '@/lib/portfolioStore'

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

const INITIAL_HOLDINGS: Holding[] = [
  { id: '1', company: '', weight: '' },
  { id: '2', company: '', weight: '' },
  { id: '3', company: '', weight: '' },
]

export default function PortfolioSetupPage() {
  const router = useRouter()
  const [showHelp, setShowHelp] = useState(false)
  const [holdings, setLocalHoldings] = useState<Holding[]>(() => {
    const saved = getHoldings()
    return saved.length > 0 ? saved : INITIAL_HOLDINGS
  })

  function updateHolding(id: string, field: 'company' | 'weight', value: string) {
    setLocalHoldings(h => h.map(x => x.id === id ? { ...x, [field]: value } : x))
  }

  function addHolding() {
    setLocalHoldings(h => [...h, { id: nextHoldingId(), company: '', weight: '' }])
  }

  function removeHolding(id: string) {
    setLocalHoldings(h => h.filter(x => x.id !== id))
  }

  function handleContinue() {
    setHoldings(holdings)
    router.push('/shock')
  }

  function handleSkip() {
    router.push('/shock')
  }

  const totalWeight = holdings.reduce((s, h) => s + (parseFloat(h.weight) || 0), 0)
  const validCount = holdings.filter(h => h.company.trim() && (parseFloat(h.weight) || 0) > 0).length

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col">

      {/* Hairline */}
      <div
        className="hairline-breathe fixed top-0 left-0 right-0 z-50 pointer-events-none"
        style={{ height: 1, background: 'linear-gradient(90deg, transparent 0%, rgba(59,130,246,0.35) 20%, rgba(59,130,246,0.85) 50%, rgba(59,130,246,0.35) 80%, transparent 100%)' }}
      />

      {/* Ambient */}
      <div className="pointer-events-none fixed inset-0" style={{ zIndex: 0, background: 'radial-gradient(ellipse 55% 50% at 50% 35%, rgba(59,130,246,0.07) 0%, transparent 65%)' }} />
      <div className="float-slower pointer-events-none fixed" style={{ bottom: '10%', left: '-5%', width: 360, height: 360, zIndex: 0, background: 'radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 70%)', filter: 'blur(40px)' }} />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-4 border-b border-zinc-800/50"
        style={{ boxShadow: '0 1px 0 rgba(59,130,246,0.06)' }}>
        <Link href="/" className="flex items-center gap-2.5">
          <TremorIcon />
          <span className="text-base font-black tracking-tight text-zinc-100">TREMOR</span>
        </Link>
        <div className="flex items-center gap-5">
          <button onClick={() => setShowHelp(true)} className="w-7 h-7 flex items-center justify-center rounded-full border border-zinc-700 text-zinc-400 hover:text-zinc-100 hover:border-zinc-500 text-xs font-bold transition-colors bg-zinc-800/50">?</button>
          <span className="text-xs font-semibold text-zinc-100">Portfolio</span>
          <Link href="/shock" className="text-xs font-medium text-zinc-500 hover:text-zinc-200 transition-colors">Shock</Link>
          <Link href="/explore" className="text-xs font-medium text-zinc-500 hover:text-zinc-200 transition-colors">Explore</Link>
          <Link href="/analyze" className="text-xs font-medium text-zinc-500 hover:text-zinc-200 transition-colors">Analysis</Link>
        </div>
      </nav>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md flex flex-col gap-8">

          {/* Header */}
          <div className="flex flex-col gap-2">
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Step 1 of 2</p>
            <h1 className="text-3xl font-black tracking-tight text-zinc-100">Your portfolio</h1>
            <p className="text-sm text-zinc-500 leading-relaxed">
              Enter your holdings and TREMOR will calculate exactly how much each earnings shock affects your portfolio through supply chain exposure.
            </p>
          </div>

          {/* Holdings card */}
          <div className="rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(160deg, #18181b, #111114)', border: '1px solid rgba(59,130,246,0.1)', boxShadow: '0 1px 0 rgba(255,255,255,0.03) inset, 0 4px 32px rgba(0,0,0,0.5)' }}>
            <div className="px-5 pt-4 pb-3.5 border-b border-zinc-800/70 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-1 h-3.5 rounded-full bg-blue-500 opacity-80" />
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Holdings</p>
              </div>
              <span className={`text-xs font-mono tabular-nums ${
                totalWeight === 0    ? 'text-zinc-600' :
                totalWeight > 100   ? 'text-red-400'  :
                totalWeight === 100 ? 'text-green-400' :
                'text-zinc-500'
              }`}>
                {totalWeight > 0 ? `${totalWeight.toFixed(1)}% allocated` : ''}
              </span>
            </div>

            <div className="px-5 py-4 flex flex-col gap-2.5">
              {/* Column labels */}
              <div className="flex items-center gap-2 px-0.5 mb-0.5">
                <span className="text-[10px] text-zinc-600 uppercase tracking-widest flex-1">Company or ticker</span>
                <span className="text-[10px] text-zinc-600 uppercase tracking-widest w-[72px] text-right">Weight</span>
                <span className="w-6" />
              </div>

              {holdings.map((h, i) => (
                <div key={h.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder={['e.g. Apple', 'e.g. TSLA', 'e.g. NVDA'][i] ?? 'Company…'}
                    value={h.company}
                    onChange={e => updateHolding(h.id, 'company', e.target.value)}
                    className="flex-1 bg-zinc-800/60 border border-zinc-700/60 rounded-lg px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all"
                  />
                  <div className="relative w-[72px] flex-shrink-0">
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={h.weight}
                      onChange={e => updateHolding(h.id, 'weight', e.target.value)}
                      className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-lg px-3 py-2.5 pr-6 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all text-right tabular-nums"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-600 pointer-events-none">%</span>
                  </div>
                  <button
                    onClick={() => removeHolding(h.id)}
                    className="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-md text-zinc-700 hover:text-zinc-400 hover:bg-zinc-800 transition-colors"
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
              ))}

              <button
                onClick={addHolding}
                className="self-start flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-400 transition-colors mt-1"
              >
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <path d="M5.5 1v9M1 5.5h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                Add another holding
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleContinue}
              disabled={validCount === 0}
              className="w-full flex items-center justify-center gap-2 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed transition-all rounded-xl px-6 py-3.5 font-semibold text-sm text-white"
              style={validCount > 0 ? { background: 'linear-gradient(135deg, #3b82f6, #2563eb)', boxShadow: '0 0 0 1px rgba(59,130,246,0.3), 0 4px 16px rgba(59,130,246,0.2), 0 1px 0 rgba(255,255,255,0.1) inset' } : {}}
            >
              Configure Shock
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button
              onClick={handleSkip}
              className="w-full text-center text-xs text-zinc-600 hover:text-zinc-400 transition-colors py-1"
            >
              Skip — set up shock scenario
            </button>
          </div>

          {/* Preview hint */}
          {validCount > 0 && (
            <p className="text-center text-xs text-zinc-600 -mt-4">
              {validCount} holding{validCount !== 1 ? 's' : ''} · TREMOR will calculate your weighted exposure after each analysis
            </p>
          )}
        </div>
      </div>

      {/* Help modal */}
      {showHelp && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setShowHelp(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none">
            <div className="w-full max-w-md pointer-events-auto rounded-2xl border border-zinc-700/60 shadow-2xl overflow-hidden" style={{ background: 'linear-gradient(160deg, #1c1c1f, #141416)' }}>
              <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-zinc-800">
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-0.5">Guide</p>
                  <h2 className="text-lg font-black tracking-tight text-zinc-100">Portfolio setup</h2>
                </div>
                <button onClick={() => setShowHelp(false)} className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                </button>
              </div>
              <div className="px-6 py-5 flex flex-col gap-4">
                {[
                  { label: 'Company or ticker', desc: 'Enter any company name or ticker symbol — e.g. Apple, TSLA, NVDA. TREMOR resolves them automatically.' },
                  { label: 'Weight %', desc: 'The percentage of your portfolio this holding represents. Weights don\'t have to sum to 100% — you can track just a subset.' },
                  { label: 'Portfolio exposure', desc: 'Once you run an analysis, TREMOR multiplies each holding\'s supply chain exposure by its weight to show your total indirect portfolio impact.' },
                  { label: 'Skip', desc: 'Skip portfolio setup and go straight to configuring your shock scenario. You can always come back to add holdings later.' },
                ].map(item => (
                  <div key={item.label} className="flex gap-3">
                    <span className="text-xs font-semibold text-zinc-300 shrink-0 w-32 pt-0.5">{item.label}</span>
                    <span className="text-xs text-zinc-500 leading-relaxed">{item.desc}</span>
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
