import { useEffect, useRef, useState } from 'react'
import { criterionLabel } from '../data/domain'
import StatusTimeline from './StatusTimeline'

// Mock SLA window — chosen so a freshly-sent request reads "21h 12m", then
// ticks down for real from there. Illustrative, not a live production SLA.
const SLA_WINDOW_MS = (21 * 60 + 12) * 60 * 1000

const STATUS_LINE = {
  sent: (t) => `Sent to provider at ${t.sent} — awaiting delivery confirmation.`,
  delivered: (t) => `Delivered to provider at ${t.delivered} — not yet viewed.`,
  viewed: (t) => `Viewed by provider's office at ${t.viewed} — no response yet.`,
  responded: (t) => `Response received at ${t.responded}.`,
}

function ordinal(n) {
  const suffixes = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return `${n}${suffixes[(v - 20) % 10] ?? suffixes[v] ?? suffixes[0]}`
}

function useSlaCountdown(sentAtMs) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(id)
  }, [])
  const remainingMs = Math.max(0, sentAtMs + SLA_WINDOW_MS - now)
  return {
    hours: Math.floor(remainingMs / 3_600_000),
    minutes: Math.floor((remainingMs % 3_600_000) / 60_000),
    overdue: remainingMs <= 0,
  }
}

export default function ClarificationSent({
  caseData,
  criteria,
  clarification,
  owner,
  onSimulateResponse,
  onDelivered,
  onViewed,
}) {
  const flagged = criteria.filter((c) => clarification.criterionIds.includes(c.id))
  const sla = useSlaCountdown(clarification.sentAtMs)

  // Keep the latest callbacks without making them scheduling dependencies —
  // a parent re-render shouldn't restart or duplicate these timers.
  const onDeliveredRef = useRef(onDelivered)
  const onViewedRef = useRef(onViewed)
  useEffect(() => {
    onDeliveredRef.current = onDelivered
    onViewedRef.current = onViewed
  })

  useEffect(() => {
    // Only auto-advance a freshly-sent request. If we're revisiting this
    // screen after the case already progressed, don't replay the timeline.
    if (clarification.stage !== 'sent') return
    const deliveredTimer = setTimeout(() => onDeliveredRef.current(), 2500)
    const viewedTimer = setTimeout(() => onViewedRef.current(), 2500 + 3000)
    return () => {
      clearTimeout(deliveredTimer)
      clearTimeout(viewedTimer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clarification.requestId])

  return (
    <div className="mx-auto max-w-2xl px-6 py-8 space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-ink">Clarification Requested</h1>
        <p className="mt-1 text-sm text-ink-faint">
          Sent to the ordering provider for {caseData.memberName} ({caseData.memberId}) by{' '}
          {owner === 'md' ? 'the medical director' : 'the reviewing nurse'}.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 rounded-lg border border-line bg-surface p-4 text-sm sm:grid-cols-4">
        <div>
          <p className="text-xs text-ink-faint">Request ID</p>
          <p className="mt-0.5 font-medium text-ink">{clarification.requestId}</p>
        </div>
        <div>
          <p className="text-xs text-ink-faint">Sent via</p>
          <p className="mt-0.5 font-medium text-ink">{clarification.sentVia}</p>
        </div>
        <div>
          <p className="text-xs text-ink-faint">Sent at</p>
          <p className="mt-0.5 font-medium text-ink">{clarification.stageTimestamps.sent}</p>
        </div>
        <div>
          <p className="text-xs text-ink-faint">Attempt</p>
          <p className="mt-0.5 font-medium text-ink">{ordinal(clarification.attempt)} request</p>
        </div>
      </div>

      <div className="space-y-3">
        {flagged.map((c) => (
          <div key={c.id} className="rounded-lg border border-line bg-surface px-4 py-3">
            <p className="text-xs font-medium text-ink-faint">{criterionLabel(c.id)}</p>
            <p className="mt-1 text-sm text-ink">{c.clarificationQuestion}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-line bg-surface px-4 py-4">
        <StatusTimeline currentStage={clarification.stage} />
        <p className="mt-3 text-sm text-ink-soft">
          {STATUS_LINE[clarification.stage](clarification.stageTimestamps)}
        </p>
      </div>

      <div className="rounded-lg border border-ambiguous-border bg-ambiguous-bg px-4 py-3">
        <p className="text-sm font-semibold text-ambiguous">
          {sla.overdue ? 'Response window has passed' : `Response due in ${sla.hours}h ${sla.minutes}m`}
        </p>
        <p className="mt-1 text-xs text-ambiguous">
          If no response by then, this case auto-escalates to a medical director.
        </p>
      </div>

      <button
        onClick={onSimulateResponse}
        className="rounded-md bg-brand px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand-dark"
      >
        Simulate provider response
      </button>
    </div>
  )
}
