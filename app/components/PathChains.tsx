'use client'

import { useMemo } from 'react'

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

interface Props {
  shockCompany: string
  affected: AffectedCompany[]
  edges: Edge[]
}

function buildPath(
  target: string,
  targetHop: number,
  shockCompany: string,
  affected: AffectedCompany[],
  edges: Edge[],
): string[] {
  if (targetHop <= 1) return [shockCompany, target]
  const prevHopNames = new Set(
    affected.filter(a => a.hop === targetHop - 1).map(a => a.company)
  )
  const link = edges.find(e =>
    (e.from === target && prevHopNames.has(e.to)) ||
    (e.to === target && prevHopNames.has(e.from))
  )
  if (!link) return [shockCompany, target]
  const mid = link.from === target ? link.to : link.from
  return [...buildPath(mid, targetHop - 1, shockCompany, affected, edges), target]
}

// ── Placeholder SVG ───────────────────────────────────────────────────────────
//
// 4 rows of abstract node-chains using the same color palette as PlaceholderGraph.
// Positions are pre-computed for a 420-wide viewBox.
//
// Row layout (y centres: 20, 62, 104, 146)
//   shock node  cx=16  r=9  (orange pulse)
//   hop-1 node  cx=112 r=8
//   hop-2 node  cx=212 r=7
//   hop-3 node  cx=312 r=6
//
// Dashed arrows run from (node_right + 2) to (next_node_left − 8); arrowhead at next_node_left − 2.

const ROWS: { hops: number; labelWidths: number[] }[] = [
  { hops: 2, labelWidths: [44, 52] },
  { hops: 3, labelWidths: [56, 38, 46] },
  { hops: 1, labelWidths: [68] },
  { hops: 2, labelWidths: [40, 60] },
]

const NODE_CX = [16, 112, 212, 312]
const NODE_R  = [9, 8, 7, 6]
const ROW_Y   = [20, 62, 104, 146]
const LABEL_START_OFFSET = 4   // gap between node right edge and label rect
const LABEL_H = 9

function PlaceholderSVG() {
  return (
    <svg
      width="100%"
      viewBox="0 0 420 170"
      preserveAspectRatio="xMidYMid meet"
    >
      {ROWS.map((row, ri) => {
        const y = ROW_Y[ri]
        const elements: React.ReactNode[] = []

        // Draw arrows + non-shock nodes (back-to-front so shock node sits on top)
        for (let hi = 1; hi <= row.hops; hi++) {
          const prevCx = NODE_CX[hi - 1]
          const prevR  = NODE_R[hi - 1]
          const cx     = NODE_CX[hi]
          const r      = NODE_R[hi]
          const opacity = 0.65 - hi * 0.12

          // Dashed line
          const lineX1 = prevCx + prevR + 3
          const lineX2 = cx - r - 9
          elements.push(
            <line
              key={`line-${ri}-${hi}`}
              x1={lineX1} y1={y} x2={lineX2} y2={y}
              stroke="#3f3f46" strokeWidth="1.2"
              strokeDasharray="4 3"
              opacity={0.45 - hi * 0.06}
            />
          )
          // Arrowhead
          const ax = cx - r - 3
          elements.push(
            <polygon
              key={`arrow-${ri}-${hi}`}
              points={`${ax - 6},${y - 4} ${ax},${y} ${ax - 6},${y + 4}`}
              fill="#3f3f46"
              opacity={0.35 - hi * 0.05}
            />
          )
          // Node circle
          elements.push(
            <circle
              key={`node-${ri}-${hi}`}
              cx={cx} cy={y} r={r}
              fill={hi === 1 ? '#27272a' : '#1c1c1e'}
              stroke={hi === 1 ? '#52525b' : '#3f3f46'}
              strokeWidth="1.5"
            >
              <animate
                attributeName="opacity"
                values={`${opacity};${opacity + 0.28};${opacity}`}
                dur="2.8s"
                begin={`${ri * 0.22 + hi * 0.14}s`}
                repeatCount="indefinite"
              />
            </circle>
          )
          // Label placeholder rect
          const labelX = cx + r + LABEL_START_OFFSET
          const labelW = row.labelWidths[hi - 1] ?? 44
          elements.push(
            <rect
              key={`label-${ri}-${hi}`}
              x={labelX} y={y - LABEL_H / 2}
              width={labelW} height={LABEL_H}
              rx="2"
              fill="#3f3f46"
              opacity={0.3 - hi * 0.05}
            >
              <animate
                attributeName="opacity"
                values={`${0.22 - hi * 0.04};${0.38 - hi * 0.04};${0.22 - hi * 0.04}`}
                dur="2.8s"
                begin={`${ri * 0.22 + hi * 0.14}s`}
                repeatCount="indefinite"
              />
            </rect>
          )
        }

        // Exposure value placeholder (right side)
        elements.push(
          <rect
            key={`exp-${ri}`}
            x="374" y={y - 6}
            width="38" height="12"
            rx="3"
            fill="#27272a"
            opacity="0.35"
          />
        )

        // Shock node (drawn last so it overlaps the arrow)
        elements.push(
          <g key={`shock-${ri}`}>
            <circle cx={NODE_CX[0]} cy={y} r={NODE_R[0]} fill="#1c1c1e" stroke="#57534e" strokeWidth="1.5">
              <animate attributeName="r"       values="9;11;9"         dur="2.4s" begin={`${ri * 0.3}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.5;0.85;0.5"   dur="2.4s" begin={`${ri * 0.3}s`} repeatCount="indefinite" />
            </circle>
            <circle cx={NODE_CX[0]} cy={y} r="4" fill="#f97316" opacity="0.55">
              <animate attributeName="opacity" values="0.4;0.7;0.4" dur="2.4s" begin={`${ri * 0.3}s`} repeatCount="indefinite" />
            </circle>
          </g>
        )

        return <g key={`row-${ri}`}>{elements}</g>
      })}

      <text
        x="210" y="164"
        textAnchor="middle"
        fill="#3f3f46"
        fontSize="9"
        fontFamily="ui-monospace, monospace"
        letterSpacing="0.08em"
      >
        RUN AN ANALYSIS TO TRACE CONTAGION PATHS
      </text>
    </svg>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PathChains({ shockCompany, affected, edges }: Props) {
  const paths = useMemo(() => {
    if (affected.length === 0) return []
    return [...affected]
      .sort((a, b) => Math.abs(b.exposure) - Math.abs(a.exposure))
      .slice(0, 6)
      .map(a => ({
        chain: buildPath(a.company, a.hop, shockCompany, affected, edges),
        exposure: a.exposure,
      }))
  }, [shockCompany, affected, edges])

  const isEmpty = paths.length === 0

  return (
    <div className={`bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg shadow-black/20 ${!isEmpty ? 'card-appear' : ''}`}
      style={!isEmpty ? { animationDelay: '60ms' } : undefined}
    >
      <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-4">
        Contagion Paths
      </h2>

      {isEmpty ? (
        <PlaceholderSVG />
      ) : (
        <div className="flex flex-col divide-y divide-zinc-800/60">
          {paths.map(({ chain, exposure }) => (
            <div key={chain.join('›')} className="flex items-center gap-2 py-2.5 first:pt-0 last:pb-0">
              <div className="flex items-center gap-1 flex-wrap flex-1 min-w-0">
                {chain.map((node, i) => (
                  <span key={i} className="flex items-center gap-1">
                    {i > 0 && (
                      <span className="text-zinc-600 text-[10px] select-none">›</span>
                    )}
                    <span className={`text-xs font-medium leading-none ${
                      i === 0
                        ? 'text-orange-400'
                        : i === chain.length - 1
                        ? 'text-zinc-100'
                        : 'text-zinc-500'
                    }`}>
                      {node}
                    </span>
                  </span>
                ))}
              </div>
              <span className={`text-xs font-mono font-semibold shrink-0 ${
                exposure >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {exposure >= 0 ? '+' : ''}{(exposure * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
