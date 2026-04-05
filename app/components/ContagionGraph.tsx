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
}

interface EdgePopup {
  x: number
  y: number
  from: string
  to: string
  relType: string
  weight: number
}

const NODE_REL_SIZE = 4

function nodeVal(hop: number, exposure: number): number {
  return hop === 0 ? 28 : Math.max(3, Math.min(60, Math.abs(exposure) * 650))
}
function nodeRadius(hop: number, exposure: number): number {
  return Math.sqrt(nodeVal(hop, exposure)) * NODE_REL_SIZE
}

// Compute ring positions with generous label padding so nothing overlaps
function ringPositions(
  nodes: AffectedCompany[],
  minRadius: number,
): { fx: number; fy: number }[] {
  const n = nodes.length
  if (n === 0) return []
  if (n === 1) return [{ fx: 0, fy: -minRadius }]
  const maxR = Math.max(...nodes.map(a => nodeRadius(a.hop, a.exposure)))
  // 100px gap per node accounts for label text extending outside the circle
  const circumferenceNeeded = n * (maxR * 2 + 100)
  const r = Math.max(minRadius, circumferenceNeeded / (2 * Math.PI))
  return nodes.map((_, i) => {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2
    return { fx: Math.cos(angle) * r, fy: Math.sin(angle) * r }
  })
}

const NEG_COLORS = ['#f1f5f9', '#ef4444', '#f87171', '#fca5a5']
const POS_COLORS = ['#f1f5f9', '#22c55e', '#4ade80', '#86efac']

// ── Sector mapping ─────────────────────────────────────────────────────────────

const COMPANY_SECTOR: Record<string, string> = {
  Apple:               'Consumer Tech',
  TSMC:                'Semiconductors',
  ASML:                'Semiconductors',
  Qualcomm:            'Semiconductors',
  Broadcom:            'Semiconductors',
  Samsung:             'Semiconductors',
  Nvidia:              'Semiconductors',
  CRUS:                'Semiconductors',
  SWKS:                'Semiconductors',
  QRVO:                'Semiconductors',
  AMKR:                'Semiconductors',
  LRCX:                'Semiconductors',
  ENTG:                'Semiconductors',
  GlobalFoundries:     'Semiconductors',
  ADI:                 'Semiconductors',
  MCHP:                'Semiconductors',
  'NXP Semiconductors':'Semiconductors',
  'Analog Devices':    'Semiconductors',
  'Microchip Technology': 'Semiconductors',
  'Marvell Technology':'Semiconductors',
  'Monolithic Power':  'Semiconductors',
  'Texas Instruments': 'Semiconductors',
  'ON Semiconductor':  'Semiconductors',
  Wolfspeed:           'Semiconductors',
  Boeing:              'Aerospace',
  'Spirit AeroSystems':'Aerospace',
  Airbus:              'Aerospace',
  RTX:                 'Aerospace',
  DCO:                 'Aerospace',
  HXL:                 'Aerospace',
  'Lockheed Martin':   'Aerospace',
  'General Dynamics':  'Aerospace',
  Textron:             'Aerospace',
  GKN:                 'Aerospace',
  'Triumph Group':     'Aerospace',
  GE:                  'Industrials',
  Amazon:              'E-commerce',
  Meta:                'E-commerce',
  Google:              'E-commerce',
  Microsoft:           'E-commerce',
  UPS:                 'Logistics',
  FedEx:               'Logistics',
  Tesla:               'Automotive',
  Ford:                'Automotive',
  GM:                  'Automotive',
  'LG Energy Solution':'Automotive',
  Volkswagen:          'Automotive',
  Stellantis:          'Automotive',
  Autoliv:             'Automotive',
  BWA:                 'Automotive',
  APTV:                'Automotive',
  Panasonic:           'Automotive',
  CATL:                'Automotive',
  'Samsung SDI':       'Automotive',
  Toyota:              'Automotive',
  BYD:                 'Automotive',
  CLS:                 'Tech',
  IBM:                 'Tech',
  Dell:                'Tech',
  HPE:                 'Tech',
  'Super Micro':       'Tech',
  'Arista Networks':   'Tech',
  Honeywell:           'Industrials',
  Albemarle:           'Industrials',
  'TE Connectivity':   'Industrials',
  'Applied Materials': 'Semiconductors',
  'Lam Research':      'Semiconductors',
}

const SECTOR_COLORS: Record<string, string> = {
  'Consumer Tech': '#818cf8',
  'Semiconductors': '#a78bfa',
  'Aerospace':      '#60a5fa',
  'E-commerce':     '#f59e0b',
  'Logistics':      '#34d399',
  'Automotive':     '#f87171',
  'Tech':           '#38bdf8',
  'Industrials':    '#94a3b8',
}

const SECTOR_ORDER = [
  'Consumer Tech', 'Semiconductors', 'Aerospace',
  'E-commerce', 'Logistics', 'Automotive', 'Tech', 'Industrials',
]

function sectorColor(company: string): string {
  const s = COMPANY_SECTOR[company]
  return s ? (SECTOR_COLORS[s] ?? '') : ''
}

const REL_TYPE_LABELS: Record<string, string> = {
  SUPPLIES_TO: 'Supplier',
  CUSTOMER_OF:  'Customer',
  CREDITOR_OF:  'Creditor',
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function ContagionGraph({ shockCompany, shockPct, affected, edges }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const graphRef = useRef<ForceGraphMethods | undefined>(undefined)
  const [width, setWidth] = useState(500)
  const [visibleHops, setVisibleHops] = useState(1)
  const [edgePopup, setEdgePopup] = useState<EdgePopup | null>(null)
  const [topN, setTopN] = useState(12)
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

  // Animate hop-by-hop reveal on new results
  useEffect(() => {
    setVisibleHops(1)
    setEdgePopup(null)
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

    const p1 = ringPositions(hop1, 140)
    const p2 = ringPositions(hop2, 260)
    const p3 = ringPositions(hop3, 390)

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

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      style={{ height: HEIGHT }}
      onClick={() => setEdgePopup(null)}
    >
      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}
        width={width}
        height={HEIGHT}
        backgroundColor="#09090b"
        nodeRelSize={NODE_REL_SIZE}
        nodeVal={node => nodeVal(node.hop as number, node.exposure as number)}
        nodeColor={node => palette[node.hop as number] ?? '#71717a'}
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
          const fillColor = palette[hop] ?? '#71717a'
          const ringColor = hop > 0 ? sectorColor(node.id as string) : ''

          ctx.beginPath()
          ctx.arc(x, y, r, 0, 2 * Math.PI)
          ctx.fillStyle = fillColor
          ctx.fill()

          if (ringColor) {
            const ringWidth = 2.5 / globalScale
            ctx.beginPath()
            ctx.arc(x, y, r + ringWidth / 2, 0, 2 * Math.PI)
            ctx.strokeStyle = ringColor
            ctx.lineWidth = ringWidth
            ctx.stroke()
          }

          if (hop === 0) {
            ctx.strokeStyle = 'rgba(255,255,255,0.25)'
            ctx.lineWidth = 2 / globalScale
            ctx.stroke()
          }

          const label = String(node.id)
          const fontSize = Math.max(9, 11 / globalScale)
          ctx.font = `600 ${fontSize}px Inter, ui-sans-serif, sans-serif`

          let labelX: number, labelY: number
          const pad = 3 / globalScale
          const gap = 5 / globalScale

          if (hop === 0) {
            labelX = x
            labelY = y + r + gap
            ctx.textAlign = 'center'
            ctx.textBaseline = 'top'
          } else {
            const mag = Math.hypot(x, y) || 1
            const ux = x / mag, uy = y / mag
            labelX = x + ux * (r + gap)
            labelY = y + uy * (r + gap)
            ctx.textAlign = ux > 0.25 ? 'left' : ux < -0.25 ? 'right' : 'center'
            ctx.textBaseline = uy > 0.25 ? 'top' : uy < -0.25 ? 'bottom' : 'middle'
          }

          const tw = ctx.measureText(label).width
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
        linkColor={() => 'rgba(82,82,91,0.6)'}
        linkWidth={link => Math.max(0.5, ((link.weight as number) ?? 0) * 6)}
        linkDirectionalArrowLength={4}
        linkDirectionalArrowRelPos={1}
        linkDirectionalArrowColor={() => '#52525b'}
        linkLabel={link => REL_TYPE_LABELS[(link as { rel_type?: string }).rel_type ?? ''] ?? ''}
        onLinkClick={(link, event) => {
          event.stopPropagation()
          const rect = containerRef.current?.getBoundingClientRect()
          const x = event.clientX - (rect?.left ?? 0)
          const y = event.clientY - (rect?.top ?? 0)
          const src = typeof link.source === 'object'
            ? (link.source as { id: string }).id : String(link.source)
          const tgt = typeof link.target === 'object'
            ? (link.target as { id: string }).id : String(link.target)
          setEdgePopup({
            x, y, from: src, to: tgt,
            relType: (link as { rel_type?: string }).rel_type ?? '',
            weight: (link.weight as number) ?? 0,
          })
        }}
        enableNodeDrag={false}
        cooldownTicks={0}
        onEngineStop={() => graphRef.current?.zoomToFit(300, 80)}
      />

      {/* Edge popup */}
      {edgePopup && (
        <div
          className="absolute z-10 bg-zinc-800 border border-zinc-700 rounded-xl px-3.5 py-2.5 shadow-xl text-xs pointer-events-none"
          style={{
            left: Math.min(edgePopup.x + 14, width - 220),
            top: Math.max(edgePopup.y - 14, 8),
            minWidth: 200,
          }}
        >
          <p className="font-semibold text-zinc-100 mb-1.5 leading-snug">
            {edgePopup.from}
            <span className="text-zinc-500 mx-1.5">→</span>
            {edgePopup.to}
          </p>
          <p className="text-zinc-300 font-medium">
            {REL_TYPE_LABELS[edgePopup.relType] ?? edgePopup.relType}
          </p>
          <p className="text-zinc-500 mt-0.5">
            Weight: {(edgePopup.weight * 100).toFixed(0)}%
          </p>
        </div>
      )}

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
