'use client'

import { useState } from 'react'
import ResultsTable from './components/ResultsTable'
import NarrativeBox from './components/NarrativeBox'
import ContagionGraph from './components/ContagionGraph'

interface AffectedCompany {
  company: string
  exposure: number
  hop: number
}

interface Results {
  shock_company: string
  shock_pct: number
  affected: AffectedCompany[]
}

export default function Home() {
  const [company, setCompany] = useState('')
  const [shockPct, setShockPct] = useState(0)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Results | null>(null)
  const [narrative, setNarrative] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!company.trim()) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/contagion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shock_company: company.trim(), shock_pct: shockPct / 100 }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error ?? `Request failed (${res.status})`)
      }

      setResults(data)
      setNarrative(data.narrative ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-1 tracking-tight">
          Earnings Contagion Risk
        </h1>
        <p className="text-zinc-400 text-sm">
          Model how an earnings shock ripples through the supply chain graph.
        </p>
      </div>

      {/* Body: side-by-side on lg+, stacked on smaller screens */}
      <div className="flex flex-col lg:flex-row gap-6 flex-1">

        {/* Left — force-directed graph */}
        <div className="lg:w-1/2 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden lg:sticky lg:top-8 lg:self-start">
          {results ? (
            <ContagionGraph
              shockCompany={results.shock_company}
              shockPct={results.shock_pct}
              affected={results.affected}
            />
          ) : (
            <div className="flex items-center justify-center text-zinc-600 text-sm" style={{ height: 520 }}>
              Run an analysis to see the contagion graph.
            </div>
          )}
        </div>

        {/* Right — form, results table, narrative */}
        <div className="lg:w-1/2 flex flex-col gap-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5 bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="company" className="text-sm font-medium text-zinc-300">
                Company
              </label>
              <input
                id="company"
                type="text"
                placeholder="e.g. Apple, Boeing, Tesla"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="shock" className="text-sm font-medium text-zinc-300">
                Earnings shock:{' '}
                <span className={shockPct >= 0 ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold'}>
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
              <div className="flex justify-between text-xs text-zinc-500">
                <span>−100%</span>
                <span>0%</span>
                <span>+100%</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !company.trim()}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:text-zinc-500 disabled:cursor-not-allowed transition-colors rounded-lg px-6 py-3 font-semibold text-sm"
            >
              {loading ? 'Analyzing…' : 'Run Analysis'}
            </button>

            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}
          </form>

          {results && <ResultsTable affected={results.affected} />}
          {narrative && <NarrativeBox narrative={narrative} />}
        </div>
      </div>
    </div>
  )
}
