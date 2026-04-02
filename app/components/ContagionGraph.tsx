'use client'

import dynamic from 'next/dynamic'
import { useMemo, useEffect, useRef, useState } from 'react'
import type { ForceGraphMethods } from 'react-force-graph-2d'

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false })

interface AffectedCompany {
  company: string
  exposure: number
  hop: number
}

interface Props {
  shockCompany: string
  shockPct: number
  affected: AffectedCompany[]
}

const NODE_REL_SIZE = 4

// Must match nodeRelSize so collision geometry is consistent
function nodeVal(hop: number, exposure: number): number {
  return hop === 0 ? 28 : Math.max(3, Math.abs(exposure) * 650)
}
function nodeRadius(hop: number, exposure: number): number {
  return Math.sqrt(nodeVal(hop, exposure)) * NODE_REL_SIZE
}

// Place `count` nodes evenly on a ring, ensuring the ring is wide enough
// so no two adjacent circles overlap.
function ringPositions(
  nodes: AffectedCompany[],
  minRadius: number,
): { fx: number; fy: number }[] {
  const n = nodes.length
  if (n === 0) return []
  if (n === 1) return [{ fx: 0, fy: -minRadius }]

  const maxR = Math.max(...nodes.map(a => nodeRadius(a.hop, a.exposure)))
  const circumferenceNeeded = n * (maxR * 2 + 20)
  const r = Math.max(minRadius, circumferenceNeeded / (2 * Math.PI))

  return nodes.map((_, i) => {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2
    return { fx: Math.cos(angle) * r, fy: Math.sin(angle) * r }
  })
}

const NEG_COLORS = ['#f1f5f9', '#ef4444', '#f87171', '#fca5a5']
const POS_COLORS = ['#f1f5f9', '#22c55e', '#4ade80', '#86efac']

export default function ContagionGraph({ shockCompany, shockPct, affected }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const graphRef = useRef<ForceGraphMethods | undefined>(undefined)
  const [width, setWidth] = useState(500)
  const HEIGHT = 520
  const isNeg = shockPct < 0
  const palette = isNeg ? NEG_COLORS : POS_COLORS

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const graphData = useMemo(() => {
    const hop1 = affected.filter(a => a.hop === 1)
    const hop2 = affected.filter(a => a.hop === 2)
    const hop3 = affected.filter(a => a.hop === 3)

    const p1 = ringPositions(hop1, 120)
    const p2 = ringPositions(hop2, 230)
    const p3 = ringPositions(hop3, 340)

    const posMap: Record<string, { fx: number; fy: number }> = {}
    hop1.forEach((a, i) => { posMap[a.company] = p1[i] })
    hop2.forEach((a, i) => { posMap[a.company] = p2[i] })
    hop3.forEach((a, i) => { posMap[a.company] = p3[i] })

    const nodes = [
      { id: shockCompany, hop: 0, exposure: shockPct, fx: 0, fy: 0 },
      ...affected.map(a => ({ id: a.company, hop: a.hop, exposure: a.exposure, ...posMap[a.company] })),
    ]

    const links = [
      ...hop1.map(a => ({ source: shockCompany, target: a.company, weight: Math.abs(a.exposure) })),
      ...hop2.map((a, i) => ({
        source: hop1.length ? hop1[i % hop1.length].company : shockCompany,
        target: a.company,
        weight: Math.abs(a.exposure),
      })),
      ...hop3.map((a, i) => ({
        source: hop2.length
          ? hop2[i % hop2.length].company
          : hop1.length ? hop1[i % hop1.length].company : shockCompany,
        target: a.company,
        weight: Math.abs(a.exposure),
      })),
    ]

    return { nodes, links }
  }, [shockCompany, shockPct, affected])

  return (
    <div ref={containerRef} className="relative w-full" style={{ height: HEIGHT }}>
      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}
        width={width}
        height={HEIGHT}
        backgroundColor="#09090b"
        nodeRelSize={NODE_REL_SIZE}
        nodeVal={node => nodeVal(node.hop as number, node.exposure as number)}
        nodeColor={node => palette[node.hop as number] ?? '#71717a'}
        // Tooltip on hover
        nodeLabel={node => {
          const exp = (node.exposure as number) * 100
          return `${node.id} — ${exp >= 0 ? '+' : ''}${exp.toFixed(1)}%`
        }}
        nodeCanvasObjectMode={() => 'replace'}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const hop = node.hop as number
          const exposure = node.exposure as number
          const x = node.x ?? 0
          const y = node.y ?? 0
          const r = nodeRadius(hop, exposure)

          // ── Circle ──────────────────────────────────────────────────────
          ctx.beginPath()
          ctx.arc(x, y, r, 0, 2 * Math.PI)
          ctx.fillStyle = palette[hop] ?? '#71717a'
          ctx.fill()

          // Subtle ring on the central node so it stands out on dark bg
          if (hop === 0) {
            ctx.strokeStyle = 'rgba(255,255,255,0.25)'
            ctx.lineWidth = 2 / globalScale
            ctx.stroke()
          }

          // ── Label ────────────────────────────────────────────────────────
          // Position the label radially outward from graph center (0,0).
          // For the central shock node, place it directly below.
          const label = String(node.id)
          const fontSize = Math.max(9, 11 / globalScale)
          ctx.font = `600 ${fontSize}px Inter, ui-sans-serif, sans-serif`

          let labelX: number
          let labelY: number
          const pad = 3 / globalScale
          const gap = 5 / globalScale

          if (hop === 0) {
            labelX = x
            labelY = y + r + gap
            ctx.textAlign = 'center'
            ctx.textBaseline = 'top'
          } else {
            // Unit vector pointing away from graph centre (0,0)
            const mag = Math.hypot(x, y) || 1
            const ux = x / mag
            const uy = y / mag
            labelX = x + ux * (r + gap)
            labelY = y + uy * (r + gap)

            // Align text so it grows outward, not back over the node
            ctx.textAlign = ux > 0.25 ? 'left' : ux < -0.25 ? 'right' : 'center'
            ctx.textBaseline = uy > 0.25 ? 'top' : uy < -0.25 ? 'bottom' : 'middle'
          }

          const tw = ctx.measureText(label).width

          // Dark pill behind the text
          const pillW = tw + pad * 2
          const pillH = fontSize + pad * 2
          let pillX = labelX
          if (ctx.textAlign === 'left') pillX = labelX - pad
          else if (ctx.textAlign === 'right') pillX = labelX - tw - pad
          else pillX = labelX - tw / 2 - pad

          let pillY = labelY
          if (ctx.textBaseline === 'top') pillY = labelY - pad
          else if (ctx.textBaseline === 'bottom') pillY = labelY - fontSize - pad
          else pillY = labelY - fontSize / 2 - pad

          ctx.fillStyle = 'rgba(9,9,11,0.82)'
          ctx.beginPath()
          const br = 3 / globalScale
          ctx.moveTo(pillX + br, pillY)
          ctx.lineTo(pillX + pillW - br, pillY)
          ctx.quadraticCurveTo(pillX + pillW, pillY, pillX + pillW, pillY + br)
          ctx.lineTo(pillX + pillW, pillY + pillH - br)
          ctx.quadraticCurveTo(pillX + pillW, pillY + pillH, pillX + pillW - br, pillY + pillH)
          ctx.lineTo(pillX + br, pillY + pillH)
          ctx.quadraticCurveTo(pillX, pillY + pillH, pillX, pillY + pillH - br)
          ctx.lineTo(pillX, pillY + br)
          ctx.quadraticCurveTo(pillX, pillY, pillX + br, pillY)
          ctx.closePath()
          ctx.fill()

          ctx.fillStyle = '#f4f4f5'
          ctx.fillText(label, labelX, labelY)
        }}
        linkColor={() => '#3f3f46'}
        linkWidth={link => Math.max(1, ((link.weight as number) ?? 0) * 8)}
        linkDirectionalArrowLength={5}
        linkDirectionalArrowRelPos={1}
        linkDirectionalArrowColor={() => '#52525b'}
        enableNodeDrag={false}
        cooldownTicks={0}
        onEngineStop={() => graphRef.current?.zoomToFit(300, 48)}
      />

      {/* Legend overlay */}
      <div className="absolute bottom-3 left-3 flex flex-col gap-1 pointer-events-none">
        {[1, 2, 3].map(hop => (
          <div key={hop} className="flex items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ background: palette[hop] }}
            />
            <span className="text-[10px] text-zinc-400">
              {hop === 1 ? 'Direct (hop 1)' : hop === 2 ? 'Indirect (hop 2)' : 'Distal (hop 3)'}
            </span>
          </div>
        ))}
      </div>

      {/* Shock summary overlay */}
      <div className="absolute bottom-3 right-3 text-right pointer-events-none">
        <p className="text-[11px] font-semibold text-zinc-300">{shockCompany}</p>
        <p className={`text-[11px] font-semibold ${isNeg ? 'text-red-400' : 'text-green-400'}`}>
          {shockPct >= 0 ? '+' : ''}{(shockPct * 100).toFixed(0)}% shock
        </p>
      </div>
    </div>
  )
}
