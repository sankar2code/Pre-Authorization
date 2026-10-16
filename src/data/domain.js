// Shared criterion definitions. Every case evaluates against the same four
// inpatient level-of-care criteria; only the per-case status/citation differs.
// hierarchyTier locates the governing source within the NCD (1) → LCD (2) →
// Payer policy (3) → MCG (4) precedence order — a different axis from the
// review tier below (which is about how much human attention a case needs).
export const CRITERIA_DEFS = [
  {
    id: 'procedure',
    label: 'Procedure meets inpatient level-of-care criteria',
    policyRef: 'LCD L33438',
    // Real, verified CMS Medicare Coverage Database URL. The LCD number is
    // illustrative for this demo, not asserted as a precise match to the
    // specific procedure in every case — the link itself is genuine.
    policyUrl: 'https://www.cms.gov/medicare-coverage-database/view/lcd.aspx?lcdid=33438&ver=47&bc=0',
    hierarchyTier: 2,
  },
  {
    id: 'comorbidities',
    label: 'Comorbidities support inpatient setting',
    policyRef: 'Payer Medical Policy §4.2 — Comorbidity Risk Criteria',
    hierarchyTier: 3,
  },
  {
    id: 'clearance',
    label: 'Required clearance / pre-op workup on file',
    policyRef: 'Payer Medical Policy §4.3 — Pre-Procedure Clearance',
    hierarchyTier: 3,
  },
  {
    id: 'los',
    label: 'Expected length of stay meets inpatient threshold (≥ 2 midnights)',
    policyRef: 'Payer Medical Policy §4.4 — InterQual Length-of-Stay Criteria',
    hierarchyTier: 3,
  },
]

export function criterionLabel(id) {
  return CRITERIA_DEFS.find((c) => c.id === id)?.label ?? id
}

// The read-only "AI-generated summary" shown in the approval confirmation
// modal, and stored verbatim in the audit trail — grounded in each met
// criterion's actual reasoning/citation, not a generic canned sentence.
export function generateApprovalSummary(caseData, criteria) {
  const met = criteria.filter((c) => c.status === 'met')
  const lines = met.map((c) => `• ${criterionLabel(c.id)} — ${c.reasoning}`)
  return [`${met.length} of ${criteria.length} criteria met for ${caseData.procedure}.`, ...lines].join(
    '\n',
  )
}

// The read-only "AI-generated summary" shown in the escalation confirmation
// modal — explains which criteria remain unresolved and why, grounded in
// each one's actual reasoning rather than a generic "needs review" line.
export function generateEscalationSummary(caseData, criteria) {
  const unresolved = criteria.filter(
    (c) => c.status === 'ambiguous' || c.status === 'missing' || c.status === 'not-met',
  )
  const lines = unresolved.map(
    (c) => `• ${criterionLabel(c.id)} (${STATUS_META[c.status].label}) — ${c.reasoning}`,
  )
  return [
    `${unresolved.length} of ${criteria.length} criteria remain unresolved for ${caseData.procedure}, exceeding the threshold for routine nurse review.`,
    ...lines,
  ].join('\n')
}

// The read-only "AI-suggested question to provider" shown in the
// clarification confirmation modal — the same targeted question(s) that
// will actually be sent, one per unresolved criterion.
export function generateClarificationSummary(criteria) {
  const outstanding = criteria.filter((c) => c.status === 'ambiguous' || c.status === 'missing')
  return outstanding.map((c) => `• ${criterionLabel(c.id)}: ${c.clarificationQuestion}`).join('\n')
}

// The read-only "AI-generated summary" shown in the medical director's
// denial confirmation modal — explains which criteria could not be
// confirmed and why, grounded in each one's actual reasoning rather than a
// generic "not met" line.
export function generateDenialSummary(caseData, criteria) {
  const unmet = criteria.filter(
    (c) => c.status === 'not-met' || c.status === 'ambiguous' || c.status === 'missing',
  )
  const lines = unmet.map(
    (c) => `• ${criterionLabel(c.id)} (${STATUS_META[c.status].label}) — ${c.reasoning}`,
  )
  return [
    `${unmet.length} of ${criteria.length} criteria could not be confirmed as met for ${caseData.procedure}.`,
    ...lines,
  ].join('\n')
}

// The read-only "AI-generated summary" shown in the Failure State's
// "Notify provider & close" modal — says what failed to parse and what the
// provider needs to resubmit, grounded in the specific pages and cause
// recorded on that case rather than a generic "bad scan" line.
export function generateFailureClosureSummary(caseData) {
  const pages = caseData.unreadablePages ?? 'Some pages'
  const cause = caseData.failureCause ? ` (${caseData.failureCause})` : ''
  return [
    `Automated extraction failed for ${caseData.memberName} (${caseData.memberId}): ${pages.toLowerCase()} of the ${caseData.packetPages}-page faxed packet are illegible${cause}. No facts were extracted and no criteria were evaluated, so no determination can be made from this packet.`,
    `• Recommended resubmission: ${pages.toLowerCase()} as a clean, higher-resolution scan (300 dpi or better, straight-on, minimal compression) or as a native PDF through the provider portal.`,
    '• A complete replacement packet is preferred, so the case can be re-processed from the start.',
  ].join('\n')
}

export function criterionPolicyRef(id) {
  return CRITERIA_DEFS.find((c) => c.id === id)?.policyRef ?? ''
}

export function criterionHierarchyTier(id) {
  return CRITERIA_DEFS.find((c) => c.id === id)?.hierarchyTier ?? null
}

// Tiers 1-2 (NCD/LCD) are public CMS coverage determinations — a citation
// there links out for real. Tiers 3-4 (Payer policy/MCG) are internal
// documents, so their citation opens a mock in-app viewer instead.
export function isExternalHierarchyTier(tier) {
  return tier === 1 || tier === 2
}

export const CMS_COVERAGE_DATABASE_URL = 'https://www.cms.gov/medicare-coverage-database/'

// A criterion's own policyUrl (a specific NCD/LCD detail page) wins when set;
// otherwise fall back to the general coverage database landing page.
export function criterionPolicyUrl(id) {
  return CRITERIA_DEFS.find((c) => c.id === id)?.policyUrl ?? CMS_COVERAGE_DATABASE_URL
}

// Review tier reflects the RISK-SCOPED REVIEW decision — a different concept
// from per-criterion status. It drives how much human attention the case
// gets, not whether any single fact was found.
export function computeReviewTier(criteria) {
  const ambiguousOrMissing = criteria.filter(
    (c) => c.status === 'ambiguous' || c.status === 'missing',
  ).length
  const notMet = criteria.filter((c) => c.status === 'not-met').length

  if (notMet > 0 || ambiguousOrMissing >= 2) {
    return {
      tier: 'escalation',
      label: 'Escalation required',
      detail: 'Two or more criteria need resolution beyond a routine nurse review.',
    }
  }
  if (ambiguousOrMissing === 1) {
    return {
      tier: 'standard',
      label: 'Standard review required',
      detail: 'One criterion needs clarification before a determination can be made.',
    }
  }
  return {
    tier: 'lighter',
    label: 'Lighter-touch review eligible',
    detail: 'All criteria are clearly met from the extracted record.',
  }
}

export const STATUS_META = {
  met: { label: 'Met', dot: 'bg-met', pill: 'bg-met-bg text-met border-met-border' },
  ambiguous: {
    label: 'Ambiguous',
    dot: 'bg-ambiguous',
    pill: 'bg-ambiguous-bg text-ambiguous border-ambiguous-border',
  },
  missing: {
    label: 'Missing',
    dot: 'bg-missing',
    pill: 'bg-missing-bg text-missing border-missing-border',
  },
  'not-met': {
    label: 'Not Met',
    dot: 'bg-notmet',
    pill: 'bg-notmet-bg text-notmet border-notmet-border',
  },
}

// Case Queue status — a coarser, queue-level view than the per-criterion
// STATUS_META above. Every case falls into exactly one of these three.
export const QUEUE_TABS = [
  { key: 'all', label: 'All' },
  { key: 'needs_action', label: 'Needs action' },
  { key: 'escalated', label: 'Escalated' },
  { key: 'closed', label: 'Closed' },
]

export function deriveQueueStatus(rt) {
  if (rt.determination || rt.closure) return 'closed'
  if (rt.owner === 'md') return 'escalated'
  return 'needs_action'
}

// A nurse-owned, still-open case whose criteria are all met after extraction
// (either clean from the start, or after a clarification resolved the gaps) —
// nothing is left but the approval itself. A display refinement of
// 'needs_action', not its own queue tab.
export function isReadyToApprove(rt) {
  return (
    deriveQueueStatus(rt) === 'needs_action' &&
    rt.phase === 'extracted' &&
    rt.criteria.every((c) => c.status === 'met')
  )
}

export const JOURNEY_STEPS = ['extracted', 'matched', 'reviewed', 'determined']

export const JOURNEY_LABELS = {
  extracted: 'Extracted',
  matched: 'Matched',
  reviewed: 'Reviewed',
  determined: 'Determined',
}

// Short, conversational names for the audit trail's dynamically-generated
// "Provider responded — X confirmed" / "MD resolved X" entries — the full
// criterion labels above are too long for that sentence shape.
export const SHORT_CRITERION_LABEL = {
  procedure: 'procedure',
  comorbidities: 'comorbidities',
  clearance: 'clearance',
  los: 'length of stay',
}

// Single source of truth for "what status is this case in right now" —
// drives both the persistent Audit Trail button's color AND (via the same
// function, called at the moment each event is logged) the color every
// audit-trail timeline entry is stamped with. Never derive these two
// independently, or they can drift apart.
export function deriveCaseStatus(rt) {
  // An administrative closure (provider notified to resubmit) is not a
  // determination, so it gets its own neutral status rather than 'determined'.
  if (rt.closure) return 'closed_admin'
  if (rt.phase === 'failed') return 'manual_review'
  if (rt.determination) return 'determined'
  if (rt.owner === 'md') return 'md_review'
  if (rt.phase === 'extracted') {
    // A clarification response flips its criterion to "met," which would
    // otherwise make computeReviewTier see a now-clean case and report
    // blue again — but a case that ever needed a clarification stays
    // amber (still under nurse review) until an actual determination
    // closes it out, not merely until the ambiguity resolves.
    const everNeededReview = rt.clarification !== null || computeReviewTier(rt.criteria).tier !== 'lighter'
    return everNeededReview ? 'nurse_review' : 'pre_review'
  }
  return 'pre_review'
}

export const CASE_STATUS_META = {
  pre_review: {
    label: 'Extracted — not yet reviewed',
    pill: 'border-nurse/30 bg-nurse-tint text-nurse-dark',
    dot: 'bg-nurse',
    pulse: true,
  },
  nurse_review: {
    label: 'Under nurse review',
    pill: 'border-ambiguous-border bg-ambiguous-bg text-ambiguous',
    dot: 'bg-ambiguous',
    pulse: true,
  },
  md_review: {
    label: 'With medical director',
    pill: 'border-escalated-border bg-escalated-bg text-escalated',
    dot: 'bg-escalated',
    pulse: true,
  },
  determined: {
    label: 'Closed',
    pill: 'border-met-border bg-met-bg text-met',
    dot: 'bg-met',
    pulse: false,
  },
  closed_admin: {
    label: 'Closed — provider notified',
    pill: 'border-nurse/30 bg-nurse-tint text-nurse-dark',
    dot: 'bg-nurse',
    pulse: false,
  },
  failed: {
    label: 'Parsing failed',
    pill: 'border-notmet-border bg-notmet-bg text-notmet',
    dot: 'bg-notmet',
    pulse: false,
  },
  manual_review: {
    label: 'Manual review — no AI determination',
    pill: 'border-missing-border bg-missing-bg text-missing',
    dot: 'bg-missing',
    pulse: false,
  },
}

// Audit-trail entries that carry a stored AI summary or human comment/
// observation are detail attached to their parent event, never a
// standalone timeline row of their own.
const DETAIL_KINDS = new Set(['ai-summary', 'reviewer-comment', 'nurse-observations'])

// Projects the raw, append-only per-case event log (rt.audit) into the
// curated set of timeline rows the Audit Trail popup renders — grouping
// every raw entry tagged with the same `group` key (e.g. the AI summary +
// reviewer comment + confirmation logged around a single approval) into
// one color-coded row, in the order each group first appeared. This is a
// VIEW over the one event log, not a second copy of it — every label and
// timestamp shown still comes directly from an entry someone actually
// logged.
export function buildAuditTimeline(audit) {
  const order = []
  const byGroup = new Map()

  for (const entry of audit) {
    if (!entry.group) continue
    if (!byGroup.has(entry.group)) {
      byGroup.set(entry.group, {
        key: entry.group,
        group: entry.group,
        status: entry.status,
        at: entry.at,
        label: null,
        outcome: entry.outcome,
        detail: [],
      })
      order.push(entry.group)
    }
    const node = byGroup.get(entry.group)
    node.at = entry.at
    node.status = entry.status
    if (entry.outcome) node.outcome = entry.outcome
    if (entry.primary === false || DETAIL_KINDS.has(entry.kind)) {
      node.detail.push(entry)
    } else {
      node.label = entry.label
    }
  }

  return order.map((key) => byGroup.get(key))
}

// A denial is still a legitimate, completed outcome — not a failure — so
// it keeps the 'determined' group and its flag icon. Only the color
// differs, which both the on-screen timeline and the CSV export need to
// agree on, hence this single shared predicate rather than two copies of
// the same check.
export function isTimelineEntryDenied(entry) {
  return entry.group === 'determined' && entry.outcome === 'Denied'
}

// Human-readable color word per status, for the CSV export's "Status"
// column — must match the color actually shown in the on-screen timeline.
const STATUS_COLOR_WORD = {
  pre_review: 'Blue',
  nurse_review: 'Amber',
  md_review: 'Orange',
  determined: 'Green',
  closed_admin: 'Blue',
  failed: 'Red',
  manual_review: 'Gray',
}

export function colorWordForEntry(entry) {
  return isTimelineEntryDenied(entry) ? 'Red' : (STATUS_COLOR_WORD[entry.status] ?? '')
}
