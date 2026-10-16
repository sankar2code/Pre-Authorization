import { CASE_STATUS_META, buildAuditTimeline, isTimelineEntryDenied } from '../data/domain'
import { FlagIcon, MailIcon, XIcon } from './AuditIcons'
import { PersonIcon } from './OwnerIcons'

// Only these four groups get a distinct icon — everything else is a plain
// color-coded dot. Determined uses a filled flag (never a checkmark) so an
// outcome reads as a milestone, not just another completed step; a parsing
// failure never borrows the flag or green, since that would misrepresent a
// failure as a successful determination.
const GROUP_ICON = {
  determined: FlagIcon,
  failed: XIcon,
  'manual-review': PersonIcon,
  'provider-notified': MailIcon,
}

// A denial is still a legitimate, completed outcome — not a failure — so it
// keeps the same filled-flag icon as an approval. Only the color changes,
// borrowing the same red used elsewhere for "not met" rather than the
// failed/manual-review palette, which is reserved for parsing failures.
const DENIED_PILL = 'border-notmet-border bg-notmet-bg text-notmet'

function DetailEntry({ entry }) {
  if (entry.kind === 'ai-summary') {
    return (
      <div className="mt-1.5">
        <p className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">
          AI-generated summary
        </p>
        <div className="mt-0.5 whitespace-pre-line rounded-md border border-line bg-paper px-3 py-2 text-xs text-ink-soft">
          {entry.label}
        </div>
      </div>
    )
  }
  if (entry.kind === 'reviewer-comment') {
    return (
      <div className="mt-1.5">
        <p className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">
          Comment — {entry.by}
        </p>
        <p className="mt-0.5 text-xs italic text-ink">&ldquo;{entry.label}&rdquo;</p>
      </div>
    )
  }
  if (entry.kind === 'nurse-observations') {
    return (
      <div className="mt-1.5">
        <p className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">
          Nurse's observations for MD
        </p>
        <p className="mt-0.5 text-xs italic text-ink">&ldquo;{entry.label}&rdquo;</p>
      </div>
    )
  }
  return <p className="mt-1.5 text-xs text-ink-faint">{entry.label}</p>
}

// Renders the curated Audit Trail timeline — the same view used by the
// persistent Audit Trail popup and the Determination screen's own Audit
// Trail tab, so there is exactly one place that decides what an event log
// looks like on screen.
export default function AuditTrailTimeline({ audit }) {
  const entries = buildAuditTimeline(audit)

  if (entries.length === 0) {
    return <p className="text-sm text-ink-faint">No activity recorded yet.</p>
  }

  return (
    <ol className="space-y-4 border-l border-line pl-4">
      {entries.map((entry) => {
        const meta = isTimelineEntryDenied(entry)
          ? { ...CASE_STATUS_META[entry.status], pill: DENIED_PILL }
          : CASE_STATUS_META[entry.status]
        const Icon = GROUP_ICON[entry.group]
        return (
          <li key={entry.key} className="relative">
            <span
              className={`absolute -left-[23px] top-0 flex h-4 w-4 items-center justify-center rounded-full border ${meta.pill}`}
            >
              {Icon ? (
                <Icon className="h-2.5 w-2.5" />
              ) : (
                <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
              )}
            </span>
            <p className="text-sm font-medium text-ink">{entry.label}</p>
            {entry.group === 'manual-review' && (
              <p className="mt-0.5 text-xs italic text-ink-faint">No AI determination made.</p>
            )}
            {entry.detail.map((d, i) => (
              <DetailEntry key={i} entry={d} />
            ))}
            <p className="mt-1 text-xs text-ink-faint">{entry.at}</p>
          </li>
        )
      })}
    </ol>
  )
}
