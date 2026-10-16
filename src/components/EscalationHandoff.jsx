import Badge from './Badge'
import { criterionLabel } from '../data/domain'

export default function EscalationHandoff({ caseData, criteria, onContinue }) {
  return (
    <div className="mx-auto max-w-2xl px-6 py-8 space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-ink">Escalated to Medical Director</h1>
        <p className="mt-1 text-sm text-ink-faint">
          {caseData.memberName} ({caseData.memberId}) has 2 or more ambiguous criteria — this
          exceeds standard nurse review scope.
        </p>
      </div>

      <div className="rounded-lg border border-line bg-surface px-4 py-3">
        <p className="text-xs font-medium text-ink-faint">Transferring with the case</p>
        <ul className="mt-2 space-y-1.5">
          {criteria.map((c) => (
            <li key={c.id} className="flex items-center justify-between text-sm">
              <span className="text-ink">{criterionLabel(c.id)}</span>
              <Badge status={c.status} />
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-ink-faint">
          The medical director receives this structured extraction and checklist — not the raw
          14-page packet.
        </p>
      </div>

      <button
        onClick={onContinue}
        className="rounded-md bg-brand px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand-dark"
      >
        Continue to Medical Director →
      </button>
    </div>
  )
}
