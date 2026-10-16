import PacketButton from './PacketButton'
import DocumentChat from './DocumentChat'

export default function ExtractionView({ caseData, onContinue }) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-8 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink">Extracted Facts</h1>
          <p className="mt-1 text-sm text-ink-faint">
            Pulled automatically from the {caseData.packetPages}-page packet — no manual read required.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <PacketButton pages={caseData.packetPages} />
          <DocumentChat />
        </div>
      </div>

      <div className="divide-y divide-line rounded-lg border border-line bg-surface">
        {caseData.extraction.map((fact) => (
          <div key={fact.label} className="grid grid-cols-[140px_1fr] gap-4 px-4 py-3">
            <span className="text-xs font-medium text-ink-faint pt-0.5">{fact.label}</span>
            <div>
              <p className="text-sm text-ink">{fact.value}</p>
              <p className="mt-1 text-xs text-ink-faint">Source: {fact.doc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button
          onClick={onContinue}
          className="rounded-md bg-brand px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand-dark"
        >
          Match against criteria →
        </button>
      </div>
    </div>
  )
}
