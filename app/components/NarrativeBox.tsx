interface NarrativeBoxProps {
  narrative: string
}

export default function NarrativeBox({ narrative }: NarrativeBoxProps) {
  return (
    <div
      className="rounded-2xl p-5 flex gap-4 card-appear"
      style={{
        background: 'linear-gradient(160deg, rgba(59,130,246,0.06) 0%, rgba(20,20,22,0.95) 40%)',
        boxShadow: '0 0 0 1px rgba(59,130,246,0.14), 0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(59,130,246,0.08)',
      }}
    >
      <div className="w-0.5 rounded-full bg-gradient-to-b from-blue-400 to-blue-600/30 flex-shrink-0 self-stretch" />
      <div>
        <h2 className="text-xs font-semibold text-blue-400/80 uppercase tracking-widest mb-2.5">
          Analyst Narrative
        </h2>
        <p className="text-zinc-200 text-sm leading-7">{narrative}</p>
      </div>
    </div>
  )
}
