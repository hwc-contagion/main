import Link from 'next/link'

const NODES = {
  center: { x: 300, y: 270, r: 28, label: 'AAPL', color: '#3b82f6' },
  ring1: [
    { x: 300, y: 165, r: 16, label: 'TSMC' },
    { x: 393, y: 228, r: 16, label: 'NVDA' },
    { x: 393, y: 312, r: 14, label: 'QCOM' },
    { x: 300, y: 375, r: 14, label: 'AVGO' },
    { x: 207, y: 312, r: 14, label: 'ASML' },
    { x: 207, y: 228, r: 14, label: 'AMZN' },
  ],
  ring2: [
    { x: 300, y:  68, r: 10, label: 'UMC' },
    { x: 456, y: 150, r:  9, label: 'MRVL' },
    { x: 490, y: 310, r: 10, label: 'INTC' },
    { x: 420, y: 440, r:  9, label: 'AMD' },
    { x: 180, y: 440, r:  9, label: 'MSFT' },
    { x: 110, y: 310, r: 10, label: 'SSNLF' },
    { x: 144, y: 150, r:  9, label: 'AMAT' },
  ],
}

function labelAnchor(x: number): 'start' | 'end' | 'middle' {
  if (x > 330) return 'start'
  if (x < 270) return 'end'
  return 'middle'
}

function labelDy(y: number): number {
  return y < 270 ? -20 : 20
}

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-black text-zinc-100 flex flex-col overflow-hidden">

      {/* Top hairline */}
      <div
        className="hairline-breathe fixed top-0 left-0 right-0 z-50 pointer-events-none"
        style={{ height: 1, background: 'linear-gradient(90deg, transparent 0%, rgba(59,130,246,0.35) 20%, rgba(59,130,246,0.85) 50%, rgba(59,130,246,0.35) 80%, transparent 100%)' }}
      />

      {/* ── Floating orbs ── */}
      <div
        className="float-slow pointer-events-none fixed"
        style={{
          top: '5%', left: '8%', width: 520, height: 520, zIndex: 0,
          background: 'radial-gradient(circle, rgba(59,130,246,0.09) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />
      <div
        className="float-slower pointer-events-none fixed"
        style={{
          top: '30%', right: '5%', width: 380, height: 380, zIndex: 0,
          background: 'radial-gradient(circle, rgba(59,130,246,0.065) 0%, transparent 70%)',
          filter: 'blur(32px)',
        }}
      />
      <div
        className="pointer-events-none fixed"
        style={{
          bottom: '-10%', left: '30%', width: 600, height: 400, zIndex: 0,
          background: 'radial-gradient(ellipse, rgba(59,130,246,0.04) 0%, transparent 65%)',
          filter: 'blur(48px)',
        }}
      />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 pt-7 pb-2">
        <div className="flex items-center gap-3">
          <TremorIcon />
          <span className="text-lg font-black tracking-tight text-zinc-100">TREMOR</span>
        </div>
        <Link
          href="/shock"
          className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors tracking-wide"
        >
          Skip setup →
        </Link>
      </nav>

      {/* Hero */}
      <div className="relative z-10 flex-1 flex flex-col lg:flex-row items-center justify-center gap-12 px-8 lg:px-16 py-12 lg:py-0 max-w-7xl mx-auto w-full">

        {/* Left — copy */}
        <div className="flex-1 flex flex-col items-start gap-8 max-w-lg">

          {/* Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-blue-400 text-[10px] font-semibold tracking-widest uppercase"
            style={{ border: '1px solid rgba(59,130,246,0.2)', background: 'rgba(59,130,246,0.06)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" style={{ boxShadow: '0 0 6px 2px rgba(59,130,246,0.6)' }} />
            Earnings Contagion Risk
          </div>

          <h1 className="text-5xl lg:text-6xl font-black tracking-tight leading-[1.06] text-zinc-100">
            When one company<br />
            shakes,{' '}
            <span
              className="text-transparent bg-clip-text"
              style={{ backgroundImage: 'linear-gradient(125deg, #60a5fa 0%, #3b82f6 45%, #93c5fd 100%)' }}
            >
              who else falls?
            </span>
          </h1>

          <p className="text-base text-zinc-400 leading-relaxed max-w-sm">
            TREMOR maps how an earnings shock ripples through the supply chain graph.
            Type a company, describe a scenario — see the contagion in seconds.
          </p>

          <div className="flex flex-col gap-3">
            <Link
              href="/portfolio"
              className="group flex items-center gap-2.5 transition-all rounded-xl px-7 py-3.5 text-white font-semibold text-sm self-start"
              style={{
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                boxShadow: '0 0 0 1px rgba(59,130,246,0.3), 0 4px 20px rgba(59,130,246,0.25), 0 1px 0 rgba(255,255,255,0.1) inset',
              }}
            >
              Get started
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="transition-transform group-hover:translate-x-0.5">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <Link
              href="/shock"
              className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors pl-1"
            >
              Skip portfolio setup →
            </Link>
          </div>
        </div>

        {/* Right — animated graph */}
        <div className="flex-1 flex items-center justify-center w-full max-w-xl lg:max-w-none">
          <div className="relative w-full" style={{ maxWidth: 560, aspectRatio: '1 / 0.92' }}>
            {/* Outer glow halo */}
            <div
              className="absolute inset-0 rounded-3xl pointer-events-none"
              style={{ boxShadow: '0 0 0 1px rgba(59,130,246,0.12), 0 0 80px 12px rgba(59,130,246,0.06), 0 20px 60px rgba(0,0,0,0.7)' }}
            />
            {/* Card background */}
            <div className="absolute inset-0 rounded-3xl"
              style={{
                background: 'linear-gradient(160deg, rgba(13,21,38,0.96), rgba(8,14,26,0.98))',
                border: '1px solid rgba(59,130,246,0.14)',
                backdropFilter: 'blur(8px)',
              }}
            />
            {/* Top edge highlight */}
            <div className="absolute top-0 left-[10%] right-[10%] h-px rounded-full pointer-events-none"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.35), transparent)' }}
            />
            <svg
              viewBox="0 0 600 552"
              className="relative w-full h-full"
              fill="none"
              style={{ display: 'block' }}
            >
              <defs>
                <radialGradient id="glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Ambient center glow */}
              <circle cx={NODES.center.x} cy={NODES.center.y} r="170" fill="url(#glow)" />

              {/* Ripple rings */}
              {[0, 1.07, 2.14].map((delay, i) => (
                <circle key={i} cx={NODES.center.x} cy={NODES.center.y} r="30" fill="none" stroke="#3b82f6" strokeWidth="1.2">
                  <animate attributeName="r" from="30" to="215" dur="3.2s" begin={`${delay}s`} repeatCount="indefinite" calcMode="spline" keyTimes="0;1" keySplines="0.25,0,0.5,1" />
                  <animate attributeName="opacity" from="0.5" to="0" dur="3.2s" begin={`${delay}s`} repeatCount="indefinite" calcMode="spline" keyTimes="0;1" keySplines="0.25,0,0.5,1" />
                </circle>
              ))}

              {/* Orbit rings */}
              <circle cx={NODES.center.x} cy={NODES.center.y} r="105" stroke="#3f3f46" strokeWidth="1" strokeDasharray="4 6" opacity="0.45" />
              <circle cx={NODES.center.x} cy={NODES.center.y} r="195" stroke="#3f3f46" strokeWidth="1" strokeDasharray="4 6" opacity="0.25" />

              {/* Spokes: center → ring1 */}
              {NODES.ring1.map((n, i) => (
                <line key={i} x1={NODES.center.x} y1={NODES.center.y} x2={n.x} y2={n.y}
                  stroke="#3b82f6" strokeWidth="1.2" opacity="0.22" />
              ))}

              {/* Spokes: ring1 → ring2 */}
              {NODES.ring2.map((n, i) => {
                const src = NODES.ring1[i % NODES.ring1.length]
                return (
                  <line key={i} x1={src.x} y1={src.y} x2={n.x} y2={n.y}
                    stroke="#52525b" strokeWidth="1" opacity="0.4" />
                )
              })}

              {/* Ring 2 nodes */}
              {NODES.ring2.map((n, i) => (
                <g key={i}>
                  <circle cx={n.x} cy={n.y} r={n.r + 6} fill="#3b82f6" opacity="0.045" />
                  <circle cx={n.x} cy={n.y} r={n.r} fill="#18181b" stroke="#3f3f46" strokeWidth="1.2" />
                  <text
                    x={n.x + (labelAnchor(n.x) === 'start' ? n.r + 6 : labelAnchor(n.x) === 'end' ? -(n.r + 6) : 0)}
                    y={n.y + (labelAnchor(n.x) === 'middle' ? labelDy(n.y) : 4)}
                    textAnchor={labelAnchor(n.x)} dominantBaseline="middle"
                    fill="#52525b" fontSize="9" fontFamily="ui-monospace, monospace" letterSpacing="0.05em">
                    {n.label}
                  </text>
                </g>
              ))}

              {/* Ring 1 nodes */}
              {NODES.ring1.map((n, i) => (
                <g key={i}>
                  <circle cx={n.x} cy={n.y} r={n.r + 8} fill="#3b82f6" opacity="0.065" />
                  <circle cx={n.x} cy={n.y} r={n.r} fill="#27272a" stroke="#52525b" strokeWidth="1.5" />
                  <text
                    x={n.x + (labelAnchor(n.x) === 'start' ? n.r + 7 : labelAnchor(n.x) === 'end' ? -(n.r + 7) : 0)}
                    y={n.y + (labelAnchor(n.x) === 'middle' ? labelDy(n.y) : 4)}
                    textAnchor={labelAnchor(n.x)} dominantBaseline="middle"
                    fill="#71717a" fontSize="10" fontFamily="ui-monospace, monospace" letterSpacing="0.05em">
                    {n.label}
                  </text>
                </g>
              ))}

              {/* Center node */}
              <circle cx={NODES.center.x} cy={NODES.center.y} r={NODES.center.r + 14} fill="url(#nodeGlow)" />
              <circle cx={NODES.center.x} cy={NODES.center.y} r={NODES.center.r} fill="#1c1c1e" stroke="#3b82f6" strokeWidth="2">
                <animate attributeName="r" values="28;32;28" dur="2.4s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.8;1;0.8" dur="2.4s" repeatCount="indefinite" />
              </circle>
              <circle cx={NODES.center.x} cy={NODES.center.y} r="11" fill="#3b82f6" opacity="0.9" />
              <circle cx={NODES.center.x} cy={NODES.center.y} r="5" fill="#eff6ff" />

              {/* Center label */}
              <text x={NODES.center.x} y={NODES.center.y + 46}
                textAnchor="middle" fill="#3b82f6" fontSize="10"
                fontFamily="ui-monospace, monospace" letterSpacing="0.1em" opacity="0.65">
                AAPL −35%
              </text>
            </svg>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 pb-8 text-center flex flex-col items-center gap-2">
        {/* Divider */}
        <div className="w-24 h-px mb-2" style={{ background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.2), transparent)' }} />
        <p className="text-zinc-700 text-[10px] tracking-widest uppercase">
          Supply chain · Earnings shock · Contagion
        </p>
      </div>

    </main>
  )
}

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
