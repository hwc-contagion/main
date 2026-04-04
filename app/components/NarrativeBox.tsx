interface NarrativeBoxProps {
  narrative: string
}

export default function NarrativeBox({ narrative }: NarrativeBoxProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg shadow-black/20 flex gap-4">
      <div className="w-0.5 rounded-full bg-orange-500 flex-shrink-0 self-stretch" />
      <div>
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-2.5">
          Analyst Narrative
        </h2>
        <p className="text-zinc-200 text-sm leading-7">{narrative}</p>
      </div>
    </div>
  )
}
