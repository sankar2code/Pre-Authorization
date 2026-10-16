import { buildAuditTimeline, colorWordForEntry } from './domain'

function csvField(value) {
  const str = String(value ?? '')
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str
}

function detailText(entry, kind) {
  return entry.detail.find((d) => d.kind === kind)?.label ?? ''
}

// "Reviewer Comment" covers both the reviewer's typed comment (Approve /
// Deny / Clarify) and the nurse's observations for the MD (Escalate) — both
// are the human's own words attached to that event, just under different
// kind tags depending on which action logged them.
function reviewerCommentFor(entry) {
  return detailText(entry, 'reviewer-comment') || detailText(entry, 'nurse-observations')
}

// One row per curated timeline entry — the exact same rows the Audit Trail
// popup shows — so the export can never drift from what's on screen.
export function buildAuditTrailCsv(caseData, audit) {
  const entries = buildAuditTimeline(audit)
  const header = [
    'Sequence #',
    'Case Name',
    'MBR ID',
    'Event',
    'Status',
    'Timestamp',
    'AI Summary',
    'Reviewer Comment',
  ]
  const rows = entries.map((entry, i) => [
    i + 1,
    caseData.memberName,
    caseData.memberId,
    entry.label,
    colorWordForEntry(entry),
    entry.at,
    detailText(entry, 'ai-summary'),
    reviewerCommentFor(entry),
  ])
  return [header, ...rows].map((row) => row.map(csvField).join(',')).join('\r\n')
}

export function auditTrailFilename(caseData) {
  const slug = caseData.memberName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  return `audit-trail-${slug}-${caseData.memberId}.csv`
}

// Genuinely triggers a browser download — a Blob URL and a temporary,
// invisible <a download> click, no backend or simulated save dialog.
export function downloadAuditTrailCsv(caseData, audit) {
  const csv = buildAuditTrailCsv(caseData, audit)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = auditTrailFilename(caseData)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
