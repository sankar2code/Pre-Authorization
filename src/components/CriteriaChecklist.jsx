import ReviewTierBanner from './ReviewTierBanner'
import CriterionRow from './CriterionRow'
import ActionPanel from './ActionPanel'
import PacketButton from './PacketButton'
import DocumentChat from './DocumentChat'
import { computeReviewTier } from '../data/domain'

export default function CriteriaChecklist({
  caseData,
  criteria,
  owner,
  escalation,
  onApprove,
  onRequestClarification,
  onEscalate,
  onDeny,
}) {
  const tier = computeReviewTier(criteria)
  const suggested =
    tier.tier === 'lighter' ? 'approve' : tier.tier === 'escalation' ? 'escalate' : 'clarify'

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink">Inpatient Level-of-Care Criteria</h1>
          <p className="mt-1 text-sm text-ink-faint">
            {caseData.procedure} — {caseData.requestedSetting} request
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <PacketButton pages={caseData.packetPages} />
          <DocumentChat />
        </div>
      </div>

      {owner === 'md' && escalation && (
        <div className="space-y-3 rounded-lg border border-line bg-surface p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">
            Why this case was escalated
          </p>
          <div>
            <p className="text-xs font-medium text-ink-faint">AI-generated summary</p>
            <div className="mt-1 whitespace-pre-line rounded-md border border-line bg-paper px-3 py-2.5 text-sm text-ink-soft">
              {escalation.summary}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-ink-faint">Nurse's observations</p>
            <p className="mt-1 text-sm italic text-ink">&ldquo;{escalation.observations}&rdquo;</p>
          </div>
        </div>
      )}

      <ReviewTierBanner tier={tier} />

      <div className="space-y-2">
        {criteria.map((c) => (
          <CriterionRow key={c.id} criterion={c} defaultOpen={c.status === 'ambiguous'} />
        ))}
      </div>

      <ActionPanel
        owner={owner}
        criteria={criteria}
        suggested={owner === 'nurse' ? suggested : suggested === 'approve' ? 'approve' : 'clarify'}
        onApprove={onApprove}
        onRequestClarification={onRequestClarification}
        onEscalate={onEscalate}
        onDeny={onDeny}
      />
    </div>
  )
}
