interface NarrativeBoxProps {
  narrative: string
}

export default function NarrativeBox({ narrative }: NarrativeBoxProps) {
  return (
    <div className="mt-6 bg-zinc-900 border border-zinc-700 rounded-lg p-5">
      <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
        Analyst Narrative
      </h2>
      <p className="text-zinc-200 text-sm leading-7 whitespace-pre-wrap">{narrative}</p>
    </div>
  )
}
