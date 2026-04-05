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

      {/* Ambient glow */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 55% at 70% 48%, rgba(59,130,246,0.13) 0%, transparent 65%)',
        }}
      />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 pt-7 pb-2">
        <div className="flex items-center gap-3">
          <TremorIcon />
          <span className="text-lg font-black tracking-tight text-zinc-100">TREMOR</span>
        </div>
        <Link
          href="/analyze"
          className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors tracking-wide"
        >
          Open app →
        </Link>
      </nav>

      {/* Hero */}
      <div className="relative z-10 flex-1 flex flex-col lg:flex-row items-center justify-center gap-12 px-8 lg:px-16 py-12 lg:py-0 max-w-7xl mx-auto w-full">

        {/* Left — copy */}
        <div className="flex-1 flex flex-col items-start gap-8 max-w-lg">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/25 bg-blue-500/8 text-blue-400 text-xs font-semibold tracking-widest uppercase">
            Earnings Contagion Risk
          </div>

          <h1 className="text-5xl lg:text-6xl font-black tracking-tight leading-[1.08] text-zinc-100">
            When one company<br />
            shakes,{' '}
            <span className="text-transparent bg-clip-text"
              style={{ backgroundImage: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)' }}>
              who else falls?
            </span>
          </h1>

          <p className="text-lg text-zinc-400 leading-relaxed max-w-sm">
            TREMOR maps how an earnings shock ripples through the supply chain graph.
            Type a company, describe a scenario — see the contagion in seconds.
          </p>

          <Link
            href="/analyze"
            className="group flex items-center gap-2.5 bg-blue-500 hover:bg-blue-400 transition-colors rounded-xl px-7 py-3.5 text-white font-semibold text-sm shadow-lg shadow-blue-500/20"
          >
            Run an analysis
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="transition-transform group-hover:translate-x-0.5">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>

        {/* Right — animated graph */}
        <div className="flex-1 flex items-center justify-center w-full max-w-xl lg:max-w-none">
          <div className="relative w-full" style={{ maxWidth: 560, aspectRatio: '1 / 0.92' }}>
            {/* Card glow */}
            <div
              className="absolute inset-0 rounded-3xl pointer-events-none"
              style={{ boxShadow: '0 0 80px 0px rgba(59,130,246,0.07), inset 0 1px 0 rgba(255,255,255,0.04)' }}
            />
            <div className="absolute inset-0 rounded-3xl backdrop-blur-sm" style={{ background: 'linear-gradient(160deg, #0d1526cc, #080e1acc)', border: '1px solid rgba(59,130,246,0.15)' }} />
            <svg
              viewBox="0 0 600 552"
              className="relative w-full h-full"
              fill="none"
              style={{ display: 'block' }}
            >
              <defs>
                <radialGradient id="glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Ambient center glow */}
              <circle cx={NODES.center.x} cy={NODES.center.y} r="160" fill="url(#glow)" />

              {/* Ripple rings — SMIL */}
              {[0, 1.07, 2.14].map((delay, i) => (
                <circle key={i} cx={NODES.center.x} cy={NODES.center.y} r="30" fill="none" stroke="#3b82f6" strokeWidth="1.2">
                  <animate attributeName="r" from="30" to="215" dur="3.2s" begin={`${delay}s`} repeatCount="indefinite" calcMode="spline" keyTimes="0;1" keySplines="0.25,0,0.5,1" />
                  <animate attributeName="opacity" from="0.45" to="0" dur="3.2s" begin={`${delay}s`} repeatCount="indefinite" calcMode="spline" keyTimes="0;1" keySplines="0.25,0,0.5,1" />
                </circle>
              ))}

              {/* Orbit rings */}
              <circle cx={NODES.center.x} cy={NODES.center.y} r="105" stroke="#3f3f46" strokeWidth="1" strokeDasharray="4 6" opacity="0.5" />
              <circle cx={NODES.center.x} cy={NODES.center.y} r="195" stroke="#3f3f46" strokeWidth="1" strokeDasharray="4 6" opacity="0.3" />

              {/* Spokes: center → ring1 */}
              {NODES.ring1.map((n, i) => (
                <line
                  key={i}
                  x1={NODES.center.x} y1={NODES.center.y}
                  x2={n.x} y2={n.y}
                  stroke="#3b82f6" strokeWidth="1.2" opacity="0.22"
                />
              ))}

              {/* Spokes: ring1 → ring2 */}
              {NODES.ring2.map((n, i) => {
                const src = NODES.ring1[i % NODES.ring1.length]
                return (
                  <line
                    key={i}
                    x1={src.x} y1={src.y}
                    x2={n.x} y2={n.y}
                    stroke="#52525b" strokeWidth="1" opacity="0.4"
                  />
                )
              })}

              {/* Ring 2 nodes */}
              {NODES.ring2.map((n, i) => (
                <g key={i}>
                  <circle cx={n.x} cy={n.y} r={n.r + 5} fill="#3b82f6" opacity="0.04" />
                  <circle cx={n.x} cy={n.y} r={n.r} fill="#18181b" stroke="#3f3f46" strokeWidth="1.2" />
                  <text
                    x={n.x + (labelAnchor(n.x) === 'start' ? n.r + 6 : labelAnchor(n.x) === 'end' ? -(n.r + 6) : 0)}
                    y={n.y + (labelAnchor(n.x) === 'middle' ? labelDy(n.y) : 4)}
                    textAnchor={labelAnchor(n.x)}
                    dominantBaseline="middle"
                    fill="#52525b"
                    fontSize="9"
                    fontFamily="ui-monospace, monospace"
                    letterSpacing="0.05em"
                  >
                    {n.label}
                  </text>
                </g>
              ))}

              {/* Ring 1 nodes */}
              {NODES.ring1.map((n, i) => (
                <g key={i}>
                  <circle cx={n.x} cy={n.y} r={n.r + 7} fill="#3b82f6" opacity="0.06" />
                  <circle cx={n.x} cy={n.y} r={n.r} fill="#27272a" stroke="#52525b" strokeWidth="1.5" />
                  <text
                    x={n.x + (labelAnchor(n.x) === 'start' ? n.r + 7 : labelAnchor(n.x) === 'end' ? -(n.r + 7) : 0)}
                    y={n.y + (labelAnchor(n.x) === 'middle' ? labelDy(n.y) : 4)}
                    textAnchor={labelAnchor(n.x)}
                    dominantBaseline="middle"
                    fill="#71717a"
                    fontSize="10"
                    fontFamily="ui-monospace, monospace"
                    letterSpacing="0.05em"
                  >
                    {n.label}
                  </text>
                </g>
              ))}

              {/* Center node */}
              <circle cx={NODES.center.x} cy={NODES.center.y} r={NODES.center.r + 12} fill="url(#nodeGlow)" />
              <circle cx={NODES.center.x} cy={NODES.center.y} r={NODES.center.r} fill="#1c1c1e" stroke="#3b82f6" strokeWidth="2">
                <animate attributeName="r" values="28;32;28" dur="2.4s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.8;1;0.8" dur="2.4s" repeatCount="indefinite" />
              </circle>
              <circle cx={NODES.center.x} cy={NODES.center.y} r="11" fill="#3b82f6" opacity="0.9" />
              <circle cx={NODES.center.x} cy={NODES.center.y} r="5" fill="#eff6ff" />

              {/* Center label */}
              <text
                x={NODES.center.x}
                y={NODES.center.y + 46}
                textAnchor="middle"
                fill="#3b82f6"
                fontSize="10"
                fontFamily="ui-monospace, monospace"
                letterSpacing="0.1em"
                opacity="0.7"
              >
                AAPL −35%
              </text>
            </svg>
          </div>
        </div>
      </div>

      {/* Footer hint */}
      <div className="relative z-10 pb-8 text-center">
        <p className="text-zinc-700 text-xs tracking-widest uppercase">
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
