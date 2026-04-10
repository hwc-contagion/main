'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getAnalyzeState, saveAnalyzeState } from '@/lib/analyzeStore'

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

export default function ShockConfigPage() {
  const router = useRouter()
  // Initialize from static defaults so server and client render the same HTML.
  // Hydrate from sessionStorage in useEffect after mount.
  const [mode, setMode] = useState<'manual' | 'natural'>('manual')
  const [company, setCompany] = useState('')
  const [shockPct, setShockPct] = useState(0)
  const [shockInput, setShockInput] = useState('0')
  const [prompt, setPrompt] = useState('')
  const [parsing, setParsing] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const [parsedCompany, setParsedCompany] = useState<string | null>(null)
  const [parsedPct, setParsedPct] = useState<number | null>(null)
  const [reasoning, setReasoning] = useState<string | null>(null)
  const [showHelp, setShowHelp] = useState(false)

  useEffect(() => {
    const saved = getAnalyzeState()
    setMode(saved.mode ?? 'manual')
    setCompany(saved.company)
    const pct = saved.shockPct ?? 0
    setShockPct(pct)
    setShockInput(String(pct))
    setPrompt(saved.prompt)
    setParsedCompany(saved.parsedCompany)
    setParsedPct(saved.parsedPct)
    setReasoning(saved.reasoning)
  }, [])

  async function handleContinue() {
    if (mode === 'natural') {
      if (!prompt.trim()) return
      setParsing(true)
      setParseError(null)
      try {
        const res = await fetch('/api/parse-shock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: prompt.trim() }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Failed to parse')
        saveAnalyzeState({
          mode, prompt, company: data.shock_company, shockPct: Math.round(data.shock_pct * 100),
          parsedCompany: data.shock_company, parsedPct: data.shock_pct,
          reasoning: data.reasoning ?? null, results: null, narrative: null, deepNarrative: null,
        })
      } catch (err) {
        setParseError(err instanceof Error ? err.message : 'Failed to parse')
        setParsing(false)
        return
      }
      setParsing(false)
    } else {
      saveAnalyzeState({ mode, company: company.trim(), shockPct, prompt, parsedCompany, parsedPct, reasoning, results: null, narrative: null, deepNarrative: null })
    }
    router.push('/analyze')
  }

  const shockColor = shockPct > 0 ? 'text-green-400' : shockPct < 0 ? 'text-red-400' : 'text-zinc-500'
  const canContinue = mode === 'natural' ? prompt.trim().length > 0 : company.trim().length > 0

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col">

      {/* Hairline */}
      <div
        className="hairline-breathe fixed top-0 left-0 right-0 z-50 pointer-events-none"
        style={{ height: 1, background: 'linear-gradient(90deg, transparent 0%, rgba(59,130,246,0.35) 20%, rgba(59,130,246,0.85) 50%, rgba(59,130,246,0.35) 80%, transparent 100%)' }}
      />

      {/* Ambient */}
      <div className="pointer-events-none fixed inset-0" style={{ zIndex: 0, background: 'radial-gradient(ellipse 55% 50% at 50% 35%, rgba(59,130,246,0.07) 0%, transparent 65%)' }} />
      <div className="float-slow pointer-events-none fixed" style={{ top: '20%', right: '-5%', width: 320, height: 320, zIndex: 0, background: 'radial-gradient(circle, rgba(59,130,246,0.055) 0%, transparent 70%)', filter: 'blur(32px)' }} />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-4 border-b border-zinc-800/50"
        style={{ boxShadow: '0 1px 0 rgba(59,130,246,0.06)' }}>
        <Link href="/" className="flex items-center gap-2.5">
          <TremorIcon />
          <span className="text-base font-black tracking-tight text-zinc-100">TREMOR</span>
        </Link>
        <div className="flex items-center gap-5">
          <button onClick={() => setShowHelp(true)} className="w-7 h-7 flex items-center justify-center rounded-full border border-zinc-700 text-zinc-400 hover:text-zinc-100 hover:border-zinc-500 text-xs font-bold transition-colors bg-zinc-800/50">?</button>
          <Link href="/portfolio" className="text-xs font-medium text-zinc-500 hover:text-zinc-200 transition-colors">Portfolio</Link>
          <span className="text-xs font-semibold text-zinc-100">Shock</span>
          <Link href="/analyze" className="text-xs font-medium text-zinc-500 hover:text-zinc-200 transition-colors">Analysis</Link>
          <Link href="/explore" className="text-xs font-medium text-zinc-500 hover:text-zinc-200 transition-colors">Explore</Link>
        </div>
      </nav>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md flex flex-col gap-8">

          {/* Header */}
          <div className="flex flex-col gap-2">
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Step 2 of 2</p>
            <h1 className="text-3xl font-black tracking-tight text-zinc-100">Shock scenario</h1>
            <p className="text-sm text-zinc-500 leading-relaxed">
              Choose a company and set an earnings shock. TREMOR will propagate it through the supply chain and show the impact on every connected company — including yours.
            </p>
          </div>

          {/* Config card */}
          <div className="rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(160deg, #18181b, #111114)', border: '1px solid rgba(59,130,246,0.1)', boxShadow: '0 1px 0 rgba(255,255,255,0.03) inset, 0 4px 32px rgba(0,0,0,0.5)' }}>
            <div className="px-5 pt-4 pb-3.5 border-b border-zinc-800/70 flex items-center gap-2.5">
              <span className="w-1 h-3.5 rounded-full bg-blue-500 opacity-80" />
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Configure</p>
            </div>
            <div className="px-5 py-5 flex flex-col gap-5">
              {/* Mode toggle */}
              <div className="flex rounded-xl overflow-hidden border border-zinc-700/50 text-sm font-medium bg-zinc-800/50">
                <button type="button" onClick={() => setMode('manual')}
                  className={`flex-1 py-2.5 transition-all duration-150 ${mode === 'manual' ? 'bg-zinc-100 text-zinc-900 font-semibold' : 'text-zinc-400 hover:text-zinc-200'}`}>
                  Manual
                </button>
                <button type="button" onClick={() => setMode('natural')}
                  className={`flex-1 py-2.5 transition-all duration-150 ${mode === 'natural' ? 'bg-zinc-100 text-zinc-900 font-semibold' : 'text-zinc-400 hover:text-zinc-200'}`}>
                  Natural Language
                </button>
              </div>

              {mode === 'manual' ? (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Company</label>
                    <input
                      type="text"
                      placeholder="e.g. Apple, Boeing, TSMC"
                      value={company}
                      onChange={e => setCompany(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && canContinue && handleContinue()}
                      className="bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-4 py-3 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all text-sm"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Earnings shock</label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={shockInput}
                          onChange={e => {
                            setShockInput(e.target.value)
                            const n = parseInt(e.target.value, 10)
                            if (!isNaN(n)) {
                              setShockPct(Math.min(100, Math.max(-100, n)))
                            }
                          }}
                          onBlur={() => setShockInput(String(shockPct))}
                          onKeyDown={e => {
                            if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                          }}
                          className={`w-16 text-center text-sm font-bold bg-zinc-800/80 border border-zinc-700/60 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all ${shockColor}`}
                        />
                        <span className={`text-sm font-bold ${shockColor}`}>%</span>
                      </div>
                    </div>
                    <input type="range" min={-100} max={100} value={shockPct}
                      onChange={e => {
                        const v = Number(e.target.value)
                        setShockPct(v)
                        setShockInput(String(v))
                      }}
                      className="accent-blue-500" />
                    <div className="flex justify-between text-xs text-zinc-600">
                      <span>−100%</span><span>0</span><span>+100%</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Describe the event</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. An earthquake destroyed Apple's main factory in Taiwan"
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
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
                  {parseError && <p className="text-xs text-red-400">{parseError}</p>}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <button
            onClick={handleContinue}
            disabled={!canContinue}
            className="w-full flex items-center justify-center gap-2 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed cursor-pointer transition-all rounded-xl px-6 py-3.5 font-semibold text-sm text-white"
            style={canContinue ? { background: 'linear-gradient(135deg, #3b82f6, #2563eb)', boxShadow: '0 0 0 1px rgba(59,130,246,0.3), 0 4px 16px rgba(59,130,246,0.2), 0 1px 0 rgba(255,255,255,0.1) inset' } : {}}
          >
            Run Analysis
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
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
                  <h2 className="text-lg font-black tracking-tight text-zinc-100">Shock configuration</h2>
                </div>
                <button onClick={() => setShowHelp(false)} className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                </button>
              </div>
              <div className="px-6 py-5 flex flex-col gap-3">
                {[
                  { label: 'Company', desc: 'Any name or ticker — e.g. Apple, TSLA, Boeing. TREMOR resolves it automatically.' },
                  { label: 'Shock %', desc: 'The earnings surprise magnitude. Negative = miss, positive = beat.' },
                  { label: 'Run Analysis', desc: 'Propagates the shock through the supply chain graph and opens the results.' },
                ].map(item => (
                  <div key={item.label} className="flex gap-3">
                    <span className="text-xs font-semibold text-zinc-300 shrink-0 w-24 pt-0.5">{item.label}</span>
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
