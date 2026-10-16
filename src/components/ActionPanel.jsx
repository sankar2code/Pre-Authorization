const BASE_BTN =
  'rounded-md px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40'
const PRIMARY_BTN = `${BASE_BTN} bg-brand text-white hover:bg-brand-dark`
const SECONDARY_BTN = `${BASE_BTN} border border-line text-ink hover:bg-paper`
const DANGER_BTN = `${BASE_BTN} bg-notmet text-white hover:brightness-90`

export default function ActionPanel({
  owner,
  criteria,
  suggested,
  onApprove,
  onRequestClarification,
  onEscalate,
  onDeny,
}) {
  const unresolvedCount = criteria.filter(
    (c) => c.status === 'ambiguous' || c.status === 'missing' || c.status === 'not-met',
  ).length
  const canApprove = unresolvedCount === 0
  const canClarify = unresolvedCount > 0

  const btnClass = (action) => (suggested === action ? PRIMARY_BTN : SECONDARY_BTN)

  return (
    <div className="rounded-lg border border-line bg-surface px-4 py-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs text-ink-faint">
          {owner === 'md' ? 'Medical director action' : 'Nurse action'}
          {!canApprove &&
            ` — ${unresolvedCount} criterion${unresolvedCount > 1 ? 'a' : ''} unresolved before you can approve`}
        </p>
        <div className="flex items-center gap-2">
          {owner === 'nurse' ? (
            <button onClick={onEscalate} className={btnClass('escalate')}>
              Escalate to Medical Director
            </button>
          ) : (
            <button onClick={onDeny} className={DANGER_BTN}>
              Deny
            </button>
          )}
          <button
            onClick={onRequestClarification}
            disabled={!canClarify}
            className={btnClass('clarify')}
          >
            Request Clarification
          </button>
          <button onClick={onApprove} disabled={!canApprove} className={btnClass('approve')}>
            Approve
          </button>
        </div>
      </div>
    </div>
  )
}
