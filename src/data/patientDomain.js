// Patient-facing view of a case. Like the nurse side, nothing here keeps
// its own copy of case state: status, tracker steps, activity and
// notifications are all derived from the same runtime the nurse and
// medical director act on, so the portal can never disagree with them.
import { CASES } from './cases'
import { daysFromToday, portalFor } from './patientPortal'

// submitted → in_review → (info_needed) → approved | denied
export function derivePatientStatus(rt) {
  if (rt.determination?.outcome === 'Approved') return 'approved'
  if (rt.determination?.outcome === 'Denied') return 'denied'
  if (rt.phase === 'failed' || rt.closure) return 'info_needed'
  if (rt.clarification?.status === 'sent') return 'info_needed'
  if (rt.read || rt.phase !== 'queued') return 'in_review'
  return 'submitted'
}

// Five fixed steps. Each is done | current | upcoming | skipped | denied.
export function patientSteps(rt) {
  const status = derivePatientStatus(rt)
  const decided = status === 'approved' || status === 'denied'
  const everNeededInfo = Boolean(rt.clarification) || rt.phase === 'failed'
  return [
    { key: 'initiated', label: 'stepInitiated', state: 'done' },
    { key: 'sent', label: 'stepSent', state: 'done' },
    {
      key: 'review',
      label: 'stepReview',
      state: status === 'submitted' ? 'upcoming' : status === 'in_review' ? 'current' : 'done',
    },
    {
      key: 'info',
      label: 'stepInfo',
      state:
        status === 'info_needed'
          ? 'current'
          : everNeededInfo
            ? 'done'
            : decided
              ? 'skipped'
              : 'upcoming',
    },
    {
      key: 'decision',
      label: status === 'denied' ? 'stepNotApproved' : 'stepApproved',
      state: status === 'approved' ? 'done' : status === 'denied' ? 'denied' : 'upcoming',
    },
  ]
}

// The outstanding questions to the provider, in patient language. Falls
// back to nothing for criteria with no patient wording on file.
export function waitingOnItems(caseData, rt) {
  const portal = portalFor(caseData.id)
  if (rt.phase === 'failed' || rt.closure) return [{ id: 'resend', failed: true }]
  if (rt.clarification?.status !== 'sent') return []
  return rt.clarification.criterionIds
    .map((id) => ({ id, text: portal.waitingOn[id] }))
    .filter((i) => i.text)
}

// Audit groups that mean something to a patient, and how to say it. A
// group seen more than once (it shouldn't be) still shows only once.
const GROUP_EVENT = {
  received: 'act_received',
  matched: 'act_matched',
  'clarification-sent': 'act_clarification',
  'clarification-resolved': 'act_resolved',
  escalated: 'act_escalated',
  failed: 'act_failed',
  'manual-review': 'act_manual',
  'provider-notified': 'act_resubmit',
}

const DETAIL_KINDS = new Set(['ai-summary', 'reviewer-comment', 'nurse-observations'])

// Newest first. Two synthetic events (the office starting the request and
// sending it) come from the portal data; everything after that is read
// straight out of the case's audit log.
export function patientActivity(caseData, rt) {
  const portal = portalFor(caseData.id)
  const submitted = daysFromToday(portal.submittedOffset)
  submitted.setHours(9, 10)
  const events = [
    { id: 'initiated', key: 'act_initiated', atMs: submitted.getTime(), kind: 'system' },
    { id: 'sent', key: 'act_sent', atMs: submitted.getTime() + 2 * 60 * 1000, kind: 'system' },
  ]
  const seen = new Set()
  rt.audit.forEach((entry, i) => {
    if (entry.patientEvent) {
      events.push({ id: `p${i}`, key: `act_p_${entry.patientEvent.type}`, data: entry.patientEvent, atMs: entry.atMs, at: entry.at, kind: 'patient' })
      return
    }
    if (entry.primary === false || DETAIL_KINDS.has(entry.kind)) return
    if (entry.group === 'determined') {
      events.push({ id: `a${i}`, key: entry.outcome === 'Denied' ? 'act_denied' : 'act_approved', atMs: entry.atMs, at: entry.at, kind: 'system', tone: entry.outcome === 'Denied' ? 'denied' : 'approved' })
      return
    }
    const key = GROUP_EVENT[entry.group]
    if (!key || seen.has(entry.group)) return
    seen.add(entry.group)
    events.push({ id: `a${i}`, key, atMs: entry.atMs, at: entry.at, kind: 'system' })
  })
  return events.reverse()
}

// Status changes the patient would be notified about: everything the plan
// or provider did, never the patient's own clicks.
export function patientNotifications(caseData, rt) {
  return patientActivity(caseData, rt).filter(
    (e) => e.kind === 'system' || e.key === 'act_p_p2p_scheduled' || e.key === 'act_p_p2p_completed',
  )
}

// The specific reasons behind a denial (CMS-0057-F requires one): every
// criterion still not met at the time of the decision.
export function denialReasonIds(rt) {
  return rt.criteria.filter((c) => c.status !== 'met').map((c) => c.id)
}

// Session-wide engagement numbers for the nurse-side Reports view.
export function patientEngagement(runtime) {
  const m = {
    cases: CASES.length,
    viewed: 0,
    approved: 0,
    accepted: 0,
    payNow: 0,
    payLater: 0,
    declined: 0,
    declineReasons: { cost: 0, opinion: 0, timing: 0, other: 0 },
    callbacks: 0,
    appeals: 0,
    assistanceChecks: 0,
  }
  for (const c of CASES) {
    const rt = runtime[c.id]
    const p = rt.patient
    if (p.viewed) m.viewed += 1
    if (rt.determination?.outcome === 'Approved') m.approved += 1
    if (p.decision === 'accepted') {
      m.accepted += 1
      if (p.payment?.when === 'now') m.payNow += 1
      else m.payLater += 1
    }
    if (p.decision === 'declined') {
      m.declined += 1
      m.declineReasons[p.decline.reason] += 1
    }
    m.callbacks += p.callbacks.length
    if (p.appeal) m.appeals += 1
    if (p.assistance) m.assistanceChecks += 1
  }
  return m
}
