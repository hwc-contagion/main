'use client'

import dynamic from 'next/dynamic'
import { useMemo, useEffect, useRef, useState } from 'react'
import type { ForceGraphMethods } from 'react-force-graph-2d'
import { COMPANY_SECTOR, SECTOR_COLORS, SECTOR_ORDER, sectorColor, sectorBadge } from '@/lib/sectors'

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false })

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
  shockPct: number
  affected: AffectedCompany[]
  edges: Edge[]
  onNodeClick?: (company: string) => void
  criticalNode?: string | null
}

interface TooltipData {
  x: number
  y: number
  id: string
  hop: number
  exposure: number
}

const NODE_REL_SIZE = 4

function nodeVal(hop: number, exposure: number): number {
  return hop === 0 ? 28 : Math.max(3, Math.min(60, Math.abs(exposure) * 650))
}
function nodeRadius(hop: number, exposure: number): number {
  return Math.sqrt(nodeVal(hop, exposure)) * NODE_REL_SIZE
}

// Compute ring positions. Per-node arc is estimated from label text width
// so the ring expands to fit long names rather than using a fixed constant.
function ringPositions(
  nodes: AffectedCompany[],
  minRadius: number,
): { fx: number; fy: number }[] {
  const n = nodes.length
  if (n === 0) return []
  if (n === 1) return [{ fx: 0, fy: -minRadius }]
  const maxR = Math.max(...nodes.map(a => nodeRadius(a.hop, a.exposure)))
  // ~7.5px per char at 11px font; add 40px margin around the label
  const maxLabelPx = Math.max(...nodes.map(a => a.company.length * 7.5))
  const perNodeArc = maxR * 2 + maxLabelPx + 40
  const r = Math.max(minRadius, (n * perNodeArc) / (2 * Math.PI))
  return nodes.map((_, i) => {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2
    return { fx: Math.cos(angle) * r, fy: Math.sin(angle) * r }
  })
}

const CENTER_COLOR = '#f1f5f9'
const NODE_FILL = '#1c1c1f'


const REL_TYPE_LABELS: Record<string, string> = {
  SUPPLIES_TO: 'Supplier',
  CUSTOMER_OF:  'Customer',
  CREDITOR_OF:  'Creditor',
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function ContagionGraph({ shockCompany, shockPct, affected, edges, onNodeClick, criticalNode }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const graphRef = useRef<ForceGraphMethods | undefined>(undefined)
  const [width, setWidth] = useState(500)
  const [visibleHops, setVisibleHops] = useState(1)
  const [topN, setTopN] = useState(12)
  const [tooltip, setTooltip] = useState<TooltipData | null>(null)
  const HEIGHT = 520
  const isNeg = shockPct < 0

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Animate hop-by-hop reveal on new results
  useEffect(() => {
    setVisibleHops(1)
    setTooltip(null)
    const t1 = setTimeout(() => setVisibleHops(2), 700)
    const t2 = setTimeout(() => setVisibleHops(3), 1400)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [shockCompany, shockPct, affected])

  // Top N companies by absolute exposure
  const topAffected = useMemo(() => {
    return [...affected]
      .sort((a, b) => Math.abs(b.exposure) - Math.abs(a.exposure))
      .slice(0, topN)
  }, [affected, topN])

  // Full layout for topAffected
  const allGraphData = useMemo(() => {
    const hop1 = topAffected.filter(a => a.hop === 1)
    const hop2 = topAffected.filter(a => a.hop === 2)
    const hop3 = topAffected.filter(a => a.hop === 3)

    const p1 = ringPositions(hop1, 200)
    const p2 = ringPositions(hop2, 370)
    const p3 = ringPositions(hop3, 540)

    const posMap: Record<string, { fx: number; fy: number }> = {}
    hop1.forEach((a, i) => { posMap[a.company] = p1[i] })
    hop2.forEach((a, i) => { posMap[a.company] = p2[i] })
    hop3.forEach((a, i) => { posMap[a.company] = p3[i] })

    const nodes = [
      { id: shockCompany, hop: 0, exposure: shockPct, fx: 0, fy: 0 },
      ...topAffected.map(a => ({
        id: a.company,
        hop: a.hop,
        exposure: a.exposure,
        ...posMap[a.company],
      })),
    ]

    const nodeIds = new Set(nodes.map(n => n.id))
    const hopOf: Record<string, number> = { [shockCompany]: 0 }
    topAffected.forEach(a => { hopOf[a.company] = a.hop })

    // Keep all edges where both endpoints are visible
    const visibleEdges = edges
      .filter(e => nodeIds.has(e.from) && nodeIds.has(e.to))
      .map(e => ({
        source: e.from,
        target: e.to,
        rel_type: e.rel_type,
        weight: e.weight,
        maxHop: Math.max(hopOf[e.from] ?? 0, hopOf[e.to] ?? 0),
      }))

    return { nodes, links: visibleEdges, hopOf }
  }, [shockCompany, shockPct, topAffected, edges])

  // Slice to currently visible hops
  const graphData = useMemo(() => {
    const nodes = allGraphData.nodes.filter(n => n.hop <= visibleHops)
    const visibleIds = new Set(nodes.map(n => n.id))
    const links = allGraphData.links.filter(l => {
      const src = typeof l.source === 'object' ? (l.source as { id: string }).id : l.source
      const tgt = typeof l.target === 'object' ? (l.target as { id: string }).id : l.target
      return visibleIds.has(src) && visibleIds.has(tgt)
    })
    return { nodes, links }
  }, [allGraphData, visibleHops])

  const sectorsPresent = useMemo(() => {
    const seen = new Set<string>()
    topAffected.forEach(a => {
      const s = COMPANY_SECTOR[a.company]
      if (s) seen.add(s)
    })
    return SECTOR_ORDER.filter(s => seen.has(s))
  }, [topAffected])

  function hitTest(gx: number, gy: number) {
    let best: typeof graphData.nodes[0] | null = null
    let bestDist = Infinity
    for (const n of graphData.nodes) {
      const nx = (n as { x?: number }).x ?? 0
      const ny = (n as { y?: number }).y ?? 0
      const r = Math.max(nodeRadius(n.hop as number, n.exposure as number), 12)
      const d = Math.hypot(gx - nx, gy - ny)
      if (d <= r && d < bestDist) { best = n; bestDist = d }
    }
    return best
  }

  function handleClick(e: React.MouseEvent) {
    if (!graphRef.current) return
    const rect = containerRef.current!.getBoundingClientRect()
    const { x: gx, y: gy } = graphRef.current.screen2GraphCoords(
      e.clientX - rect.left,
      e.clientY - rect.top,
    )
    const node = hitTest(gx, gy)
    if (node) onNodeClick?.(String(node.id))
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!graphRef.current) return
    const rect = containerRef.current!.getBoundingClientRect()
    const { x: gx, y: gy } = graphRef.current.screen2GraphCoords(
      e.clientX - rect.left,
      e.clientY - rect.top,
    )
    const node = hitTest(gx, gy)
    if (!node) { setTooltip(null); return }

    setTooltip({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      id: String(node.id),
      hop: node.hop as number,
      exposure: node.exposure as number,
    })
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      style={{ height: HEIGHT }}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setTooltip(null)}
    >
      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}
        width={width}
        height={HEIGHT}
        backgroundColor="#09090b"
        nodeRelSize={NODE_REL_SIZE}
        nodeVal={node => nodeVal(node.hop as number, node.exposure as number)}
        nodeColor={node => (node.hop as number) === 0 ? CENTER_COLOR : NODE_FILL}
        nodeLabel=""
        nodeCanvasObjectMode={() => 'replace'}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const hop = node.hop as number
          const exposure = node.exposure as number
          const x = node.x ?? 0
          const y = node.y ?? 0
          const r = nodeRadius(hop, exposure)
          const isCritical = String(node.id) === criticalNode
          const fillColor  = hop === 0 ? CENTER_COLOR : (isCritical ? '#1c1408' : NODE_FILL)
          const ringColor  = hop > 0 ? sectorColor(node.id as string) : ''

          // Critical node: amber glow layers
          if (isCritical) {
            for (const [extra, alpha] of [[18/globalScale, 0.05], [11/globalScale, 0.12], [5/globalScale, 0.22]] as [number,number][]) {
              ctx.beginPath()
              ctx.arc(x, y, r + extra, 0, 2 * Math.PI)
              ctx.fillStyle = `rgba(245,158,11,${alpha})`
              ctx.fill()
            }
          }

          ctx.beginPath()
          ctx.arc(x, y, r, 0, 2 * Math.PI)
          ctx.fillStyle = fillColor
          ctx.fill()

          if (hop === 0) {
            ctx.strokeStyle = 'rgba(255,255,255,0.25)'
            ctx.lineWidth = 2 / globalScale
            ctx.stroke()
          } else {
            const ringWidth = (isCritical ? 5 : 3.5) / globalScale
            ctx.beginPath()
            ctx.arc(x, y, r + ringWidth / 2, 0, 2 * Math.PI)
            ctx.strokeStyle = isCritical ? '#f59e0b' : (ringColor || '#a1a1aa')
            ctx.lineWidth = ringWidth
            ctx.stroke()
          }

          const label = String(node.id)
          const fontSize = Math.max(9, 11 / globalScale)
          const pad = 3 / globalScale
          const gap = 10 / globalScale
          ctx.font = `600 ${fontSize}px Inter, ui-sans-serif, sans-serif`

          const tw = ctx.measureText(label).width
          const pillW = tw + pad * 2
          const pillH = fontSize + pad * 2

          // Anchor point: direction away from graph center, at node edge + gap
          let anchorX: number, anchorY: number
          let pillX: number, pillY: number

          if (hop === 0) {
            // Center node: label below
            anchorX = x - pillW / 2
            anchorY = y + r + gap
          } else {
            const mag = Math.hypot(x, y) || 1
            const ux = x / mag
            const uy = y / mag
            // Tip of the label closest to the node
            const tipX = x + ux * (r + gap)
            const tipY = y + uy * (r + gap)

            // Horizontal alignment: left of tip if going right, right if going left, centered if vertical
            if (ux > 0.3) {
              anchorX = tipX
            } else if (ux < -0.3) {
              anchorX = tipX - pillW
            } else {
              anchorX = tipX - pillW / 2
            }

            // Vertical alignment: below tip if going down, above if going up, centered if horizontal
            if (uy > 0.3) {
              anchorY = tipY
            } else if (uy < -0.3) {
              anchorY = tipY - pillH
            } else {
              anchorY = tipY - pillH / 2
            }
          }

          pillX = anchorX
          pillY = anchorY

          ctx.fillStyle = 'rgba(9,9,11,0.85)'
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
          ctx.textAlign = 'left'
          ctx.textBaseline = 'top'
          ctx.fillText(label, pillX + pad, pillY + pad)
        }}
        linkColor={() => 'rgba(82,82,91,0.6)'}
        linkWidth={link => Math.max(0.5, ((link.weight as number) ?? 0) * 6)}
        linkDirectionalArrowLength={4}
        linkDirectionalArrowRelPos={1}
        linkDirectionalArrowColor={() => '#52525b'}
        linkLabel=""
        onNodeHover={(node) => {
          if (containerRef.current) {
            containerRef.current.style.cursor = node && onNodeClick ? 'pointer' : 'default'
          }
        }}
        enableNodeDrag={false}
        cooldownTicks={0}
        onEngineStop={() => graphRef.current?.zoomToFit(300, 80)}
      />

      {/* Node tooltip — name, exposure, sector */}
      {tooltip && (() => {
        const badge = sectorBadge(tooltip.id)
        return (
          <div
            className="absolute z-10 bg-zinc-900/95 border border-zinc-700 rounded-xl px-3.5 py-2.5 shadow-2xl text-xs pointer-events-none"
            style={{
              left: Math.min(tooltip.x + 16, width - 190),
              top: Math.max(tooltip.y - 8, 8),
            }}
          >
            <p className="font-bold text-zinc-100 text-sm leading-tight">{tooltip.id}</p>
            {badge && (
              <p className="mt-0.5" style={{ color: badge.color }}>{badge.sector}</p>
            )}
            {tooltip.exposure !== 0 && (
              <p className={`font-mono font-semibold mt-1 ${tooltip.exposure < 0 ? 'text-red-400' : 'text-green-400'}`}>
                {tooltip.exposure >= 0 ? '+' : ''}{(tooltip.exposure * 100).toFixed(1)}% exposure
              </p>
            )}
          </div>
        )
      })()}

      {/* Top-N slider — top right */}
      <div
        className="absolute top-3 right-3 flex items-center gap-2 bg-zinc-900/80 border border-zinc-800 rounded-xl px-3 py-1.5 pointer-events-auto"
        onClick={e => e.stopPropagation()}
      >
        <span className="text-[10px] text-zinc-500 uppercase tracking-widest whitespace-nowrap">
          Show
        </span>
        <input
          type="range"
          min={3}
          max={Math.min(25, affected.length)}
          value={topN}
          onChange={e => setTopN(Number(e.target.value))}
          className="w-20 accent-zinc-400"
        />
        <span className="text-[11px] font-mono text-zinc-300 w-4 text-right">
          {Math.min(topN, affected.length)}
        </span>
      </div>

      {/* Sector legend */}
      <div className="absolute bottom-3 left-3 flex flex-col gap-1 pointer-events-none">
        {sectorsPresent.map(sector => (
          <div key={sector} className="flex items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ border: `2px solid ${SECTOR_COLORS[sector]}` }}
            />
            <span className="text-[10px] text-zinc-400">{sector}</span>
          </div>
        ))}
      </div>

      {/* Shock summary */}
      <div className="absolute bottom-3 right-3 text-right pointer-events-none">
        <p className="text-[11px] font-semibold text-zinc-300">{shockCompany}</p>
        <p className={`text-[11px] font-semibold ${isNeg ? 'text-red-400' : 'text-green-400'}`}>
          {shockPct >= 0 ? '+' : ''}{(shockPct * 100).toFixed(0)}% shock
        </p>
      </div>
    </div>
  )
}
