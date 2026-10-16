import Badge from './Badge'
import ActionPanel from './ActionPanel'
import { criterionLabel } from '../data/domain'

export default function ProviderResponse({
  criteria,
  clarification,
  owner,
  onApprove,
  onRequestClarification,
  onEscalate,
  onDeny,
}) {
  const updated = criteria.filter((c) => clarification.criterionIds.includes(c.id))

  return (
    <div className="mx-auto max-w-2xl px-6 py-8 space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-ink">Provider Response Received</h1>
        <p className="mt-1 text-sm text-ink-faint">
          Only the flagged criteria are re-checked — the rest of the packet is not reprocessed.
        </p>
      </div>

      <div className="space-y-3">
        {updated.map((c) => (
          <div key={c.id} className="rounded-lg border border-met-border bg-met-bg px-4 py-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-ink-faint">{criterionLabel(c.id)}</p>
              <Badge status={c.status} />
            </div>
            <p className="mt-1.5 text-sm italic text-ink">&ldquo;{c.quote}&rdquo;</p>
            <p className="mt-1.5 text-sm text-ink-soft">{c.reasoning}</p>
          </div>
        ))}
      </div>

      <ActionPanel
        owner={owner}
        criteria={criteria}
        suggested="approve"
        onApprove={onApprove}
        onRequestClarification={onRequestClarification}
        onEscalate={onEscalate}
        onDeny={onDeny}
      />
    </div>
  )
}
