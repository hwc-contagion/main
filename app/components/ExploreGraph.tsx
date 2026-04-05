'use client'

import dynamic from 'next/dynamic'
import { useMemo, useEffect, useRef, useState } from 'react'
import type { ForceGraphMethods } from 'react-force-graph-2d'
import { forceCollide } from 'd3-force'
import { COMPANY_SECTOR, SECTOR_COLORS, SECTOR_ORDER, sectorColor, sectorBadge } from '@/lib/sectors'

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false })

interface GraphNode { name: string }
interface GraphEdge { from: string; to: string; rel_type: string; weight: number }

interface Props {
  nodes: GraphNode[]
  edges: GraphEdge[]
  onNodeClick?: (company: string) => void
  highlightCompany?: string | null
  activeFilter?: string | null
  criticalNode?: string | null
  focusCompany?: string | null
  zoomResetTrigger?: number
}

interface TooltipData { x: number; y: number; id: string }

const NODE_REL_SIZE = 4
const NODE_FILL = '#1c1c1f'

// Radius runs ~8–22px depending on connection count
function nodeVal(degree: number): number {
  return Math.max(4, Math.min(30, degree * 1.8))
}

// Convert a #rrggbb hex color to rgba(r,g,b,a)
function hexAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}
function nodeRadius(degree: number): number {
  return Math.sqrt(nodeVal(degree)) * NODE_REL_SIZE
}

export default function ExploreGraph({
  nodes,
  edges,
  onNodeClick,
  highlightCompany,
  activeFilter,
  criticalNode,
  focusCompany,
  zoomResetTrigger,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const graphRef     = useRef<ForceGraphMethods | undefined>(undefined)
  const [width, setWidth]     = useState(800)
  const [tooltip, setTooltip] = useState<TooltipData | null>(null)
  const HEIGHT = 680

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const degreeMap = useMemo(() => {
    const map = new Map<string, number>()
    edges.forEach(e => {
      map.set(e.from, (map.get(e.from) ?? 0) + 1)
      map.set(e.to,   (map.get(e.to)   ?? 0) + 1)
    })
    return map
  }, [edges])

  const graphData = useMemo(() => ({
    nodes: nodes.map(n => ({ id: n.name, degree: degreeMap.get(n.name) ?? 1 })),
    links: edges.map(e => ({ source: e.from, target: e.to, weight: e.weight })),
  }), [nodes, edges, degreeMap])

  // Configure forces once graph data is ready.
  // Uses a retry loop because the ForceGraph2D dynamic import may not have
  // mounted yet when this effect first fires (e.g. on a hard refresh).
  useEffect(() => {
    if (graphData.nodes.length === 0) return
    let cancelled = false

    function configure() {
      if (cancelled) return
      const fg = graphRef.current
      if (!fg) { setTimeout(configure, 50); return }

      const charge = fg.d3Force('charge') as { strength: (v: number) => unknown } | undefined
      charge?.strength(-320)

      const link = fg.d3Force('link') as { distance: (v: number) => unknown } | undefined
      link?.distance(80)

      fg.d3Force('collision', forceCollide((node: unknown) => {
        const n = node as { degree?: number }
        return nodeRadius(n.degree ?? 1) + 10
      }))

      fg.d3ReheatSimulation()
    }

    configure()
    return () => { cancelled = true }
  }, [graphData])

  // Zoom to focused company when it changes
  useEffect(() => {
    if (!focusCompany || !graphRef.current) return
    const node = graphData.nodes.find(n => n.id === focusCompany) as { id: string; x?: number; y?: number } | undefined
    if (!node || node.x == null || node.y == null) return
    graphRef.current.centerAt(node.x, node.y, 800)
    graphRef.current.zoom(4, 800)
  }, [focusCompany, graphData.nodes])

  // Zoom back out to fit all nodes
  useEffect(() => {
    if (zoomResetTrigger == null || zoomResetTrigger === 0) return
    graphRef.current?.zoomToFit(600, 60)
  }, [zoomResetTrigger])

  const sectorsPresent = useMemo(() => {
    const seen = new Set<string>()
    nodes.forEach(n => { const s = COMPANY_SECTOR[n.name]; if (s) seen.add(s) })
    return SECTOR_ORDER.filter(s => seen.has(s))
  }, [nodes])

  function hitTest(gx: number, gy: number) {
    let best: typeof graphData.nodes[0] | null = null
    let bestDist = Infinity
    for (const n of graphData.nodes) {
      const nx = (n as { x?: number }).x ?? 0
      const ny = (n as { y?: number }).y ?? 0
      const r  = Math.max(nodeRadius((n as { degree: number }).degree), 8)
      const d  = Math.hypot(gx - nx, gy - ny)
      if (d <= r && d < bestDist) { best = n; bestDist = d }
    }
    return best
  }

  function handleClick(e: React.MouseEvent) {
    if (!graphRef.current) return
    const rect = containerRef.current!.getBoundingClientRect()
    const { x: gx, y: gy } = graphRef.current.screen2GraphCoords(
      e.clientX - rect.left, e.clientY - rect.top,
    )
    const node = hitTest(gx, gy)
    if (node) onNodeClick?.(String(node.id))
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!graphRef.current) return
    const rect = containerRef.current!.getBoundingClientRect()
    const { x: gx, y: gy } = graphRef.current.screen2GraphCoords(
      e.clientX - rect.left, e.clientY - rect.top,
    )
    const node = hitTest(gx, gy)
    if (!node) { setTooltip(null); return }
    setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, id: String(node.id) })
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
        nodeVal={node => nodeVal((node as { degree: number }).degree)}
        nodeColor={() => NODE_FILL}
        nodeLabel=""
        nodeCanvasObjectMode={() => 'replace'}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const company = String(node.id)
          const degree  = (node as { degree: number }).degree
          const x = node.x ?? 0
          const y = node.y ?? 0
          const r = nodeRadius(degree)
          const ring          = sectorColor(company)
          const isHighlighted = company === highlightCompany
          const isCritical    = company === criticalNode
          const sector        = COMPANY_SECTOR[company]
          const isDimmed      = activeFilter != null && sector !== activeFilter

          ctx.globalAlpha = isDimmed ? 0.12 : 1

          // Critical node: layered amber glow behind the node
          if (isCritical && !isDimmed) {
            const glows = [
              { extra: 18 / globalScale, alpha: 0.05 },
              { extra: 11 / globalScale, alpha: 0.12 },
              { extra:  5 / globalScale, alpha: 0.22 },
            ]
            for (const g of glows) {
              ctx.beginPath()
              ctx.arc(x, y, r + g.extra, 0, 2 * Math.PI)
              ctx.fillStyle = `rgba(245,158,11,${g.alpha})`
              ctx.fill()
            }
          }

          // Node fill — dark amber tint for critical, normal for others
          ctx.beginPath()
          ctx.arc(x, y, r, 0, 2 * Math.PI)
          ctx.fillStyle = isCritical ? '#1c1408' : NODE_FILL
          ctx.fill()

          // Ring — amber for critical, white for highlighted, sector color otherwise
          const ringWidth = (isCritical ? 5 : isHighlighted ? 4.5 : 3) / globalScale
          ctx.beginPath()
          ctx.arc(x, y, r + ringWidth / 2, 0, 2 * Math.PI)
          ctx.strokeStyle = isCritical ? '#f59e0b' : isHighlighted ? '#ffffff' : (ring || '#a1a1aa')
          ctx.lineWidth = ringWidth
          ctx.stroke()

          // Labels: all nodes when zoomed in, only hubs when partially zoomed
          const showLabel =
            globalScale >= 0.75 ||
            (globalScale >= 0.45 && degree >= 5)

          if (showLabel) {
            const fontSize = Math.max(7, 10 / globalScale)
            const pad      = 2.5 / globalScale
            const gap      = 7  / globalScale
            ctx.font = `600 ${fontSize}px Inter, ui-sans-serif, sans-serif`
            const tw    = ctx.measureText(company).width
            const pillW = tw + pad * 2
            const pillH = fontSize + pad * 2

            // Radiate label outward from graph center
            const mag  = Math.hypot(x, y) || 1
            const ux   = x / mag
            const uy   = y / mag
            const tipX = x + ux * (r + gap)
            const tipY = y + uy * (r + gap)

            let ax: number, ay: number
            if (ux > 0.3)       ax = tipX
            else if (ux < -0.3) ax = tipX - pillW
            else                 ax = tipX - pillW / 2

            if (uy > 0.3)       ay = tipY
            else if (uy < -0.3) ay = tipY - pillH
            else                 ay = tipY - pillH / 2

            // Background pill
            ctx.fillStyle = 'rgba(9,9,11,0.90)'
            const br = 2 / globalScale
            ctx.beginPath()
            ctx.moveTo(ax + br, ay)
            ctx.lineTo(ax + pillW - br, ay)
            ctx.quadraticCurveTo(ax + pillW, ay, ax + pillW, ay + br)
            ctx.lineTo(ax + pillW, ay + pillH - br)
            ctx.quadraticCurveTo(ax + pillW, ay + pillH, ax + pillW - br, ay + pillH)
            ctx.lineTo(ax + br, ay + pillH)
            ctx.quadraticCurveTo(ax, ay + pillH, ax, ay + pillH - br)
            ctx.lineTo(ax, ay + br)
            ctx.quadraticCurveTo(ax, ay, ax + br, ay)
            ctx.closePath()
            ctx.fill()

            ctx.fillStyle = isCritical ? '#fcd34d' : isHighlighted ? '#ffffff' : '#d4d4d8'
            ctx.textAlign    = 'left'
            ctx.textBaseline = 'top'
            ctx.fillText(company, ax + pad, ay + pad)
          }

          ctx.globalAlpha = 1
        }}
        linkCurvature={0.18}
        linkColor={link => {
          const src    = typeof link.source === 'object' ? (link.source as { id: string }).id : String(link.source)
          const tgt    = typeof link.target === 'object' ? (link.target as { id: string }).id : String(link.target)
          const srcS   = COMPANY_SECTOR[src]
          const color  = srcS ? (SECTOR_COLORS[srcS] ?? '#787882') : '#787882'

          if (!activeFilter) return hexAlpha(color, 0.45)

          const tgtS = COMPANY_SECTOR[tgt]
          return (srcS === activeFilter || tgtS === activeFilter)
            ? hexAlpha(color, 0.75)
            : hexAlpha(color, 0.05)
        }}
        linkWidth={link => Math.max(0.8, ((link.weight as number) ?? 0) * 5)}
        linkDirectionalArrowLength={3.5}
        linkDirectionalArrowRelPos={1}
        linkDirectionalArrowColor={link => {
          const src  = typeof link.source === 'object' ? (link.source as { id: string }).id : String(link.source)
          const srcS = COMPANY_SECTOR[src]
          const color = srcS ? (SECTOR_COLORS[srcS] ?? '#787882') : '#787882'
          return hexAlpha(color, 0.6)
        }}
        linkLabel=""
        onNodeHover={node => {
          if (containerRef.current)
            containerRef.current.style.cursor = node && onNodeClick ? 'pointer' : 'default'
        }}
        enableNodeDrag={false}
        cooldownTicks={300}
        warmupTicks={60}
        onEngineStop={() => graphRef.current?.zoomToFit(500, 60)}
      />

      {/* Hover tooltip */}
      {tooltip && (() => {
        const badge = sectorBadge(tooltip.id)
        return (
          <div
            className="absolute z-10 bg-zinc-900/95 border border-zinc-700 rounded-xl px-3.5 py-2.5 shadow-2xl text-xs pointer-events-none"
            style={{
              left: Math.min(tooltip.x + 16, width - 200),
              top:  Math.max(tooltip.y - 8, 8),
            }}
          >
            <p className="font-bold text-zinc-100 text-sm leading-tight">{tooltip.id}</p>
            {badge && <p className="mt-0.5" style={{ color: badge.color }}>{badge.sector}</p>}
            <p className="mt-0.5 text-zinc-500 text-[10px]">
              {degreeMap.get(tooltip.id) ?? 0} connections
            </p>
          </div>
        )
      })()}

      {/* Sector legend — bottom left */}
      <div className="absolute bottom-3 left-3 flex flex-col gap-1 pointer-events-none">
        {sectorsPresent.map(sector => (
          <div key={sector} className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ border: `2px solid ${SECTOR_COLORS[sector]}` }}
            />
            <span className="text-[10px] text-zinc-400">{sector}</span>
          </div>
        ))}
      </div>

      {/* Stats — bottom right */}
      <div className="absolute bottom-3 right-3 text-right pointer-events-none">
        <p className="text-[11px] text-zinc-500">
          {nodes.length} companies · {edges.length} connections
        </p>
      </div>
    </div>
  )
}
