import { useState, useCallback } from 'react'
import { CASES } from '../data/cases'
import { computeReviewTier, deriveCaseStatus, SHORT_CRITERION_LABEL } from '../data/domain'

const MONTH_ABBR = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

// Single source of truth for every displayed timestamp in the app (audit
// trail entries, clarification stage timestamps) — format once here rather
// than at each call site, so every "at" string in the UI stays consistent.
function timeNow() {
  const now = new Date()
  const date = `${MONTH_ABBR[now.getMonth()]}/${String(now.getDate()).padStart(2, '0')}/${now.getFullYear()}`
  const time = now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  })
  return `${date}, ${time}`
}

// Mock request IDs, sequential per session — good enough for a demo where
// nothing needs to survive a reload.
let clarificationRequestCounter = 8841
function nextClarificationId() {
  clarificationRequestCounter += 1
  return `CLR-${clarificationRequestCounter}`
}

// Splits "Sentence one. Sentence two." into its first sentence and the
// remainder — used to give the Audit Trail a short primary label for a
// parsing failure while keeping the full reason available as detail.
function splitFirstSentence(text) {
  const [first, ...rest] = text.split(/(?<=\.)\s+/)
  return [first, rest.join(' ')]
}

// "length of stay", "comorbidities and clearance", "a, b, and c"
function joinLabels(labels) {
  if (labels.length <= 1) return labels[0] ?? ''
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`
  return `${labels.slice(0, -1).join(', ')}, and ${labels[labels.length - 1]}`
}

function mdResolvedPhrase(labels) {
  if (labels.length === 2) return 'both criteria'
  if (labels.length === 1) return `${labels[0]} criterion`
  return `${labels.length} criteria`
}

function initialRuntime(caseData) {
  return {
    phase: 'queued', // queued -> extracting -> extracted|failed
    owner: 'nurse', // nurse | md
    read: false, // has the nurse opened this case at all yet
    criteria: caseData.criteria.map((c) => ({ ...c })),
    clarification: null, // see requestClarification for shape
    escalation: null, // { summary, observations } — set on escalate()
    determination: null, // { outcome, resolvedVia, resolvedBy }
    closure: null, // { summary, comment } — administrative close (provider notified), never a determination
    audit: [],
    patient: initialPatientState(),
    // Illustrative cases (e.g. Emily Watson) can seed a pre-resolved state
    // so the Case Queue has a realistic Closed case without replaying it.
    ...caseData.seedRuntime,
    ...(caseData.seedRuntime?.patient && {
      patient: { ...initialPatientState(), ...caseData.seedRuntime.patient },
    }),
  }
}

// What the patient has done in their portal. Lives on the same case
// runtime as everything else, so the nurse side and Reports see it.
function initialPatientState() {
  return {
    viewed: false,
    decision: null, // 'accepted' | 'declined'
    payment: null, // { when: 'now', method, amount, ref } | { when: 'later', option: 'service' | months, monthly, amount }
    decline: null, // { reason, note }
    assistance: null, // { household, income, result }
    appeal: null, // { requestedAtMs, stage: 'requested' | 'scheduled' | 'completed', scheduledForMs }
    callbacks: [], // { id, who, topic, time, atMs }
    checklist: {}, // itemId -> true
    notify: { sms: true, email: false },
    notifSeen: 0,
  }
}

let patientEventCounter = 0
let paymentRefCounter = 40217
let callbackCounter = 310

function buildInitialState() {
  const state = {}
  for (const c of CASES) state[c.id] = initialRuntime(c)
  return state
}

export function useCaseRuntime() {
  const [runtime, setRuntime] = useState(buildInitialState)

  // Every entry is stamped with the status the case was in AT THAT MOMENT
  // (meta.status wins when a call site needs to say something the current
  // rt snapshot can't distinguish on its own — e.g. "parsing failed" vs.
  // "routed to manual review" are both rt.phase === 'failed'). Absent an
  // override, the status comes from the exact same deriveCaseStatus used
  // for the Audit Trail button's live color, so the two can never drift.
  const log = useCallback((caseId, label, meta = {}) => {
    setRuntime((prev) => {
      const status = meta.status ?? deriveCaseStatus(prev[caseId])
      return {
        ...prev,
        [caseId]: {
          ...prev[caseId],
          audit: [...prev[caseId].audit, { at: timeNow(), atMs: Date.now(), label, ...meta, status }],
        },
      }
    })
  }, [])

  const patch = useCallback((caseId, partial) => {
    setRuntime((prev) => ({
      ...prev,
      [caseId]: { ...prev[caseId], ...(typeof partial === 'function' ? partial(prev[caseId]) : partial) },
    }))
  }, [])

  const markRead = useCallback(
    (caseId) => {
      patch(caseId, { read: true })
    },
    [patch],
  )

  const startExtraction = useCallback(
    (caseId) => {
      patch(caseId, { phase: 'extracting' })
      log(caseId, 'Case received', { group: 'received' })
    },
    [patch, log],
  )

  const finishExtraction = useCallback(
    (caseId) => {
      const caseData = CASES.find((c) => c.id === caseId)
      if (caseData.parseFailed) {
        patch(caseId, { phase: 'failed' })
        const [firstSentence, rest] = splitFirstSentence(caseData.failureReason)
        log(caseId, `Parsing failed — ${firstSentence}`, { group: 'failed', status: 'failed' })
        if (rest) {
          log(caseId, rest, { group: 'failed', status: 'failed', primary: false })
        }
        log(caseId, 'Routed to manual review', { group: 'manual-review', status: 'manual_review' })
        return
      }
      const total = caseData.criteria.length
      const metCount = caseData.criteria.filter((c) => c.status === 'met').length
      const tier = computeReviewTier(caseData.criteria)
      patch(caseId, { phase: 'extracted' })
      const label =
        tier.tier === 'lighter'
          ? `${metCount} of ${total} criteria matched — lighter-touch review eligible`
          : `${metCount} of ${total} matched — ${total - metCount} flagged ambiguous`
      log(caseId, label, { group: 'matched' })
    },
    [patch, log],
  )

  // clarification shape:
  // {
  //   criterionIds, owner, status: 'sent' | 'responded',
  //   requestId, sentVia, attempt,
  //   stage: 'sent' | 'delivered' | 'viewed' | 'responded',
  //   sentAtMs, stageTimestamps: { sent, delivered, viewed, responded } (display strings, null until reached)
  // }
  // Mirrors the approval/escalation flows: the AI's suggested question and
  // the reviewer's own comment are logged as two distinct, attributed audit
  // entries before the "sent" transition itself.
  const requestClarification = useCallback(
    (caseId, owner, { summary, comment }) => {
      const requestId = nextClarificationId()
      const sentAt = timeNow()
      patch(caseId, (prevCase) => {
        const outstanding = prevCase.criteria.filter(
          (c) => c.status === 'ambiguous' || c.status === 'missing',
        )
        return {
          clarification: {
            criterionIds: outstanding.map((c) => c.id),
            owner,
            status: 'sent',
            requestId,
            sentVia: 'Provider portal',
            attempt: 1, // no case in this demo re-requests clarification twice
            stage: 'sent',
            sentAtMs: Date.now(),
            stageTimestamps: { sent: sentAt, delivered: null, viewed: null, responded: null },
          },
        }
      })
      const resolvedByLabel = owner === 'md' ? 'Medical Director' : 'Nurse'
      const sentLabel =
        owner === 'md' ? 'MD requested clarification from provider' : 'Clarification sent to provider'
      log(caseId, summary, { kind: 'ai-summary', group: 'clarification-sent', primary: false })
      log(caseId, comment, {
        kind: 'reviewer-comment',
        by: resolvedByLabel,
        group: 'clarification-sent',
        primary: false,
      })
      log(
        caseId,
        `Clarification ${requestId} requested by ${owner === 'md' ? 'medical director' : 'nurse'} — sent via provider portal`,
        { group: 'clarification-sent', primary: false },
      )
      log(caseId, sentLabel, { group: 'clarification-sent' })
    },
    [patch, log],
  )

  const advanceClarificationDelivered = useCallback(
    (caseId) => {
      const at = timeNow()
      patch(caseId, (prevCase) => ({
        clarification: {
          ...prevCase.clarification,
          stage: 'delivered',
          stageTimestamps: { ...prevCase.clarification.stageTimestamps, delivered: at },
        },
      }))
      log(caseId, 'Clarification delivered to provider', { group: 'clarification-sent', primary: false })
    },
    [patch, log],
  )

  const advanceClarificationViewed = useCallback(
    (caseId) => {
      const at = timeNow()
      patch(caseId, (prevCase) => ({
        clarification: {
          ...prevCase.clarification,
          stage: 'viewed',
          stageTimestamps: { ...prevCase.clarification.stageTimestamps, viewed: at },
        },
      }))
      log(caseId, "Clarification viewed by provider's office", {
        group: 'clarification-sent',
        primary: false,
      })
    },
    [patch, log],
  )

  // Reads the pre-update snapshot directly from `runtime` (rather than
  // trying to pull computed values out of patch's functional updater,
  // which React doesn't guarantee runs before the code following it) so
  // the label below is computed from real data, not a stale default.
  const receiveProviderResponse = useCallback(
    (caseId) => {
      const at = timeNow()
      const prevCase = runtime[caseId]
      const ids = prevCase.clarification?.criterionIds ?? []
      const resolvedOwner = prevCase.clarification?.owner ?? prevCase.owner
      const resolvedLabels = prevCase.criteria
        .filter((c) => ids.includes(c.id))
        .map((c) => SHORT_CRITERION_LABEL[c.id] ?? c.id)
      const criteria = prevCase.criteria.map((c) =>
        ids.includes(c.id)
          ? {
              ...c,
              status: 'met',
              quote: c.providerResponseQuote ?? c.quote,
              reasoning: c.resolvedReasoning ?? c.reasoning,
              justResolved: true,
            }
          : c,
      )
      patch(caseId, {
        criteria,
        clarification: {
          ...prevCase.clarification,
          status: 'responded',
          stage: 'responded',
          stageTimestamps: { ...prevCase.clarification.stageTimestamps, responded: at },
        },
      })
      const label =
        resolvedOwner === 'md'
          ? `MD resolved ${mdResolvedPhrase(resolvedLabels)}`
          : `Provider responded — ${joinLabels(resolvedLabels)} confirmed`
      log(caseId, label, { group: 'clarification-resolved' })
    },
    [runtime, patch, log],
  )

  // Mirrors the approval flow: the AI's escalation reasoning and the
  // nurse's own observations are stored on the case (for the MD's screens
  // to display) and logged as two distinct, attributed audit entries.
  const escalate = useCallback(
    (caseId, { summary, observations }) => {
      patch(caseId, { owner: 'md', escalation: { summary, observations } })
      log(caseId, summary, { kind: 'ai-summary', group: 'escalated', primary: false })
      log(caseId, observations, { kind: 'nurse-observations', group: 'escalated', primary: false })
      log(caseId, 'Escalated to medical director', { group: 'escalated' })
    },
    [patch, log],
  )

  const assumeMdOwnership = useCallback(
    (caseId) => {
      log(caseId, 'Case reassigned — ownership transferred to medical director')
    },
    [log],
  )

  const determine = useCallback(
    (caseId, { outcome, resolvedVia, resolvedBy }) => {
      patch(caseId, { determination: { outcome, resolvedVia, resolvedBy } })
      log(caseId, `Determined — ${outcome}`, { group: 'determined', outcome })
    },
    [patch, log],
  )

  // The mandatory-comment approval flow logs two distinct, clearly
  // attributed audit entries before the determination itself — what the AI
  // concluded, and what the human reviewer actually said. Sharing the
  // 'determined' group with the log call above nests both under the same
  // "Determined — Approved" timeline row regardless of which is logged first.
  const recordApproval = useCallback(
    (caseId, { summary, comment, resolvedByLabel }) => {
      log(caseId, summary, { kind: 'ai-summary', group: 'determined', primary: false })
      log(caseId, comment, {
        kind: 'reviewer-comment',
        by: resolvedByLabel,
        group: 'determined',
        primary: false,
      })
    },
    [log],
  )

  // Mirrors recordApproval exactly, for the medical director's denial —
  // same 'determined' group, same two attributed entries, so the resulting
  // "Determined — Denied" row carries both the AI's reasoning and the MD's
  // own denial rationale.
  const recordDenial = useCallback(
    (caseId, { summary, comment }) => {
      log(caseId, summary, { kind: 'ai-summary', group: 'determined', primary: false })
      log(caseId, comment, {
        kind: 'reviewer-comment',
        by: 'Medical Director',
        group: 'determined',
        primary: false,
      })
    },
    [log],
  )

  // Administrative closure for a packet that could not be parsed. Same
  // two attributed entries as every other action (the AI's summary, then
  // the nurse's own justification), grouped under one "Provider notified —
  // case closed" row. Deliberately NOT a determination: rt.determination
  // stays null and the row uses its own neutral group/status, never the
  // 'determined' flag.
  const notifyProviderAndClose = useCallback(
    (caseId, { summary, comment }) => {
      patch(caseId, { closure: { summary, comment } })
      log(caseId, summary, { kind: 'ai-summary', group: 'provider-notified', primary: false })
      log(caseId, comment, {
        kind: 'reviewer-comment',
        by: 'Nurse',
        group: 'provider-notified',
        primary: false,
      })
      log(caseId, 'Provider notified — case closed', { group: 'provider-notified' })
    },
    [patch, log],
  )

  // ---- Patient portal actions. Each one that matters to the care team is
  // also logged to the case's audit trail, under its own group so it shows
  // as its own row, tagged with patientEvent so the portal can phrase it
  // in the patient's language.
  const patchPatient = useCallback(
    (caseId, partial) => {
      patch(caseId, (prev) => ({
        patient: { ...prev.patient, ...(typeof partial === 'function' ? partial(prev.patient) : partial) },
      }))
    },
    [patch],
  )

  const logPatient = useCallback(
    (caseId, label, patientEvent) => {
      patientEventCounter += 1
      log(caseId, `Patient: ${label}`, { group: `patient-${patientEventCounter}`, patientEvent })
    },
    [log],
  )

  const patientView = useCallback(
    (caseId) => {
      if (runtime[caseId].patient.viewed) return
      patchPatient(caseId, { viewed: true })
    },
    [runtime, patchPatient],
  )

  const patientAccept = useCallback(
    (caseId, payment) => {
      const ref = payment.when === 'now' ? `PAY-${(paymentRefCounter += 1)}` : null
      const stored = { ...payment, ref }
      patchPatient(caseId, { decision: 'accepted', payment: stored, decline: null })
      if (payment.when === 'now') {
        logPatient(caseId, `accepted cost estimate and paid $${payment.amount.toFixed(2)} (${payment.method === 'hsa' ? 'HSA/FSA' : 'card'}, ${ref})`, { type: 'accepted_now', ...stored })
      } else {
        const how = payment.option === 'service' ? 'pay at time of service' : `${payment.option}-month payment plan`
        logPatient(caseId, `accepted cost estimate — ${how}`, { type: 'accepted_later', ...stored })
      }
    },
    [patchPatient, logPatient],
  )

  const patientDecline = useCallback(
    (caseId, { reason, note }) => {
      patchPatient(caseId, { decision: 'declined', decline: { reason, note }, payment: null })
      logPatient(caseId, `declined the request (${reason}${note ? `: "${note}"` : ''}) — provider office to contact patient`, { type: 'declined', reason })
    },
    [patchPatient, logPatient],
  )

  const patientReopen = useCallback(
    (caseId) => {
      patchPatient(caseId, { decision: null, payment: null, decline: null })
      logPatient(caseId, 'reopened cost estimate', { type: 'reopened' })
    },
    [patchPatient, logPatient],
  )

  const patientAssistance = useCallback(
    (caseId, assistance) => {
      patchPatient(caseId, { assistance })
      logPatient(caseId, `checked financial assistance eligibility — ${assistance.result}`, { type: 'assistance' })
    },
    [patchPatient, logPatient],
  )

  const patientRequestAppeal = useCallback(
    (caseId) => {
      patchPatient(caseId, { appeal: { requestedAtMs: Date.now(), stage: 'requested', scheduledForMs: null } })
      logPatient(caseId, 'asked provider to appeal the denial; peer-to-peer review requested', { type: 'appeal' })
    },
    [patchPatient, logPatient],
  )

  // Simulated progression of the doctor-to-doctor review after an appeal
  // request: requested -> scheduled -> completed.
  const advancePeerToPeer = useCallback(
    (caseId, stage) => {
      patchPatient(caseId, (p) => ({
        appeal: {
          ...p.appeal,
          stage,
          scheduledForMs: stage === 'scheduled' ? Date.now() + 2 * 24 * 60 * 60 * 1000 : p.appeal.scheduledForMs,
        },
      }))
      logPatient(caseId, stage === 'scheduled' ? 'peer-to-peer call scheduled with medical director' : 'peer-to-peer call completed', { type: stage === 'scheduled' ? 'p2p_scheduled' : 'p2p_completed' })
    },
    [patchPatient, logPatient],
  )

  const patientCallback = useCallback(
    (caseId, { who, topic, time }) => {
      callbackCounter += 1
      const req = { id: `CB-${callbackCounter}`, who, topic, time, atMs: Date.now() }
      patchPatient(caseId, (p) => ({ callbacks: [...p.callbacks, req] }))
      logPatient(caseId, `requested a callback from ${who === 'office' ? 'the provider office' : 'the health plan'} about ${topic} (${time})`, { type: 'callback', who })
    },
    [patchPatient, logPatient],
  )

  const togglePatientChecklist = useCallback(
    (caseId, itemId) => {
      patchPatient(caseId, (p) => ({ checklist: { ...p.checklist, [itemId]: !p.checklist[itemId] } }))
    },
    [patchPatient],
  )

  const setPatientNotify = useCallback(
    (caseId, notify) => {
      patchPatient(caseId, { notify })
    },
    [patchPatient],
  )

  const markPatientNotificationsSeen = useCallback(
    (caseId, count) => {
      patchPatient(caseId, { notifSeen: count })
    },
    [patchPatient],
  )

  return {
    runtime,
    markRead,
    startExtraction,
    finishExtraction,
    requestClarification,
    advanceClarificationDelivered,
    advanceClarificationViewed,
    recordApproval,
    recordDenial,
    notifyProviderAndClose,
    receiveProviderResponse,
    escalate,
    assumeMdOwnership,
    determine,
    patientView,
    patientAccept,
    patientDecline,
    patientReopen,
    patientAssistance,
    patientRequestAppeal,
    advancePeerToPeer,
    patientCallback,
    togglePatientChecklist,
    setPatientNotify,
    markPatientNotificationsSeen,
  }
}
