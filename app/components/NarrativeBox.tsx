'use client'

import { useEffect, useState } from 'react'

interface NarrativeBoxProps {
  narrative: string | null
  loading: boolean
  deepNarrative: string | null
  deepLoading: boolean
  onLearnMore: () => void
}

const LOADING_MESSAGES = [
  'Mapping supply chain exposure…',
  'Analyzing contagion vectors…',
  'Modeling second-order effects…',
  'Cross-referencing earnings relationships…',
  'Synthesizing risk factors…',
  'Identifying sector vulnerabilities…',
]

function DeepLoadingText() {
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % LOADING_MESSAGES.length), 1800)
    return () => clearInterval(t)
  }, [])
  return (
    <p className="text-xs text-zinc-500 font-mono tracking-wide">
      {LOADING_MESSAGES[idx]}
    </p>
  )
}

export default function NarrativeBox({ narrative, loading, deepNarrative, deepLoading, onLearnMore }: NarrativeBoxProps) {
  const [expanded, setExpanded] = useState(false)

  // Auto-expand when deep narrative first arrives
  useEffect(() => {
    if (deepNarrative) setExpanded(true)
  }, [deepNarrative])

  function handleLearnMore() {
    if (deepNarrative) {
      setExpanded(true)
    } else {
      onLearnMore()
    }
  }

  return (
    <div
      className="rounded-2xl p-5 flex gap-4 card-appear"
      style={{ background: '#18181b', border: '1px solid #27272a' }}
    >
      <div className="w-0.5 rounded-full bg-gradient-to-b from-blue-400 to-blue-600/30 flex-shrink-0 self-stretch" />
      <div className="flex-1 min-w-0">
        <h2 className="text-xs font-semibold text-blue-400/80 uppercase tracking-widest mb-2.5">
          Analyst Narrative
        </h2>

        {/* Short narrative or skeleton */}
        {loading ? (
          <div className="space-y-2 animate-pulse">
            <div className="h-3 bg-zinc-800 rounded w-full" />
            <div className="h-3 bg-zinc-800 rounded w-11/12" />
            <div className="h-3 bg-zinc-800 rounded w-4/5" />
            <div className="h-3 bg-zinc-800 rounded w-full" />
          </div>
        ) : narrative ? (
          <p className="text-zinc-200 text-sm leading-7">{narrative}</p>
        ) : null}

        {/* Deep narrative loading */}
        {deepLoading && (
          <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center gap-2.5">
            <span className="w-3 h-3 border border-blue-500/40 border-t-blue-400 rounded-full animate-spin flex-shrink-0" />
            <DeepLoadingText />
          </div>
        )}

        {/* Deep narrative — collapsible */}
        {deepNarrative && expanded && (
          <div className="mt-4 pt-4 border-t border-zinc-800 space-y-4">
            {deepNarrative.split('\n\n').filter(Boolean).map((para, i) => (
              <p key={i} className="text-zinc-300 text-sm leading-7">{para}</p>
            ))}
          </div>
        )}

        {/* Learn more / Show less toggle */}
        {narrative && !deepLoading && (
          <button
            onClick={expanded ? () => setExpanded(false) : handleLearnMore}
            className="mt-3 text-xs text-zinc-500 hover:text-blue-400 transition-colors underline underline-offset-2"
          >
            {expanded ? 'Show less ↑' : 'Learn more →'}
          </button>
        )}
      </div>
    </div>
  )
}
