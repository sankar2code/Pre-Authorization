import Badge from './Badge'
import { criterionLabel, criterionPolicyRef } from '../data/domain'

const PATH_COPY = {
  'straight-through': 'Resolved straight through — all criteria were clearly met on extraction.',
  clarification: 'Resolved after provider clarification.',
  escalation: 'Resolved via medical director escalation.',
}

export default function Determination({ caseData, criteria, determination, onBackToQueue }) {
  const isApproved = determination.outcome === 'Approved'

  return (
    <div className="mx-auto max-w-2xl px-6 py-8 space-y-5">
      <div
        className={`rounded-lg border px-4 py-4 ${
          isApproved ? 'border-met-border bg-met-bg' : 'border-notmet-border bg-notmet-bg'
        }`}
      >
        <p className={`text-lg font-semibold ${isApproved ? 'text-met' : 'text-notmet'}`}>
          {determination.outcome}
        </p>
        <p className="mt-1 text-sm text-ink-soft">
          {caseData.memberName} ({caseData.memberId}) — {caseData.procedure}
        </p>
        <p className="mt-2 text-sm font-medium text-ink">{PATH_COPY[determination.resolvedVia]}</p>
        <p className="mt-0.5 text-xs text-ink-faint">Determined by: {determination.resolvedBy}</p>
      </div>

      <div className="border-b border-line pb-2">
        <p className="text-sm font-medium text-ink">Citation Trail</p>
      </div>

      <div className="space-y-2">
        {criteria.map((c) => (
          <div key={c.id} className="rounded-lg border border-line bg-surface px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-ink">{criterionLabel(c.id)}</span>
              <Badge status={c.status} />
            </div>
            <p className="mt-1 text-xs text-ink-faint">{criterionPolicyRef(c.id)}</p>
          </div>
        ))}
      </div>

      <button
        onClick={onBackToQueue}
        className="rounded-md border border-line px-5 py-2.5 text-sm font-medium text-ink transition hover:bg-paper"
      >
        ← Back to Queue
      </button>
    </div>
  )
}
