import { useState } from 'react'
import PageHeader from './PageHeader'
import { patientEngagement } from '../data/patientDomain'

// Shared time-saved baseline (directional). Team Impact's "~15 min/case" is
// MANUAL_MIN_PER_CASE - TOOL_MIN_PER_CASE.
const MANUAL_MIN_PER_CASE = 45
const TOOL_MIN_PER_CASE = 5
const SAVED_MIN_PER_CASE = MANUAL_MIN_PER_CASE - TOOL_MIN_PER_CASE
// Illustrative: this prototype has no per-nurse case ownership data.
const NURSE_CASES_REVIEWED = 6

const TABS = [
  { key: 'team', label: 'Team Impact' },
  { key: 'you', label: 'Your Impact' },
  { key: 'patients', label: 'Patient Engagement' },
]

const DECLINE_LABEL = {
  cost: 'Cost too high',
  opinion: 'Wants a second opinion',
  timing: 'Timing',
  other: 'Other',
}

function pct(n, d) {
  return d ? `${Math.round((n / d) * 100)}%` : '—'
}

// Live from this session's runtime, unlike the illustrative tabs: every
// number moves as patients act in their portal.
function PatientEngagement({ runtime }) {
  const m = patientEngagement(runtime)
  const declineRows = Object.entries(m.declineReasons)
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-nurse/30 bg-nurse-tint px-4 py-4">
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-semibold text-nurse-dark">{pct(m.accepted, m.approved)}</p>
          <p className="text-sm text-nurse-dark/80">of approved patients accepted their cost estimate</p>
        </div>
        <div className="my-3 border-t border-nurse/20" />
        <p className="text-xs text-nurse-dark/80">
          {m.accepted} accepted of {m.approved} approved · {m.declined} declined ·{' '}
          {m.approved - m.accepted - m.declined} still deciding
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-line bg-surface px-4 py-4">
          <p className="text-2xl font-semibold text-ink">
            {m.viewed} <span className="text-base font-normal text-ink-faint">/ {m.cases}</span>
          </p>
          <p className="mt-1 text-sm text-ink-soft">Patients who opened their portal</p>
        </div>
        <div className="rounded-lg border border-met-border bg-met-bg px-4 py-4">
          <p className="text-2xl font-semibold text-met">
            {m.payNow} <span className="text-base font-normal text-met/70">now</span> · {m.payLater}{' '}
            <span className="text-base font-normal text-met/70">later</span>
          </p>
          <p className="mt-1 text-sm text-met/80">How accepting patients chose to pay</p>
        </div>
        <div className="rounded-lg border border-ambiguous-border bg-ambiguous-bg px-4 py-4">
          <p className="text-2xl font-semibold text-ambiguous">{m.callbacks}</p>
          <p className="mt-1 text-sm text-ambiguous/80">Callback requests</p>
        </div>
        <div className="rounded-lg border border-notmet-border bg-notmet-bg px-4 py-4">
          <p className="text-2xl font-semibold text-notmet">{m.appeals}</p>
          <p className="mt-1 text-sm text-notmet/80">Appeal requests after a denial</p>
        </div>
        <div className="col-span-2 rounded-lg border border-line bg-surface px-4 py-4">
          <p className="text-sm font-medium text-ink">Declines by reason</p>
          {m.declined === 0 ? (
            <p className="mt-1 text-sm text-ink-faint">No patient has declined yet.</p>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {declineRows.map(([key, n]) => (
                <li key={key} className="flex items-center gap-3 text-sm">
                  <span className="w-44 shrink-0 text-ink-soft">{DECLINE_LABEL[key]}</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-paper">
                    <span className="block h-full rounded-full bg-nurse" style={{ width: pct(n, m.declined) }} />
                  </span>
                  <span className="w-6 text-right tabular-nums text-ink">{n}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-ink-faint">
            {m.assistanceChecks} financial-assistance check{m.assistanceChecks === 1 ? '' : 's'} run
          </p>
        </div>
      </div>

      <p className="text-xs text-ink-faint">
        Live for this session: counts update as patients act in the patient view. One closed case
        (Emily Watson) is seeded with an accepted payment plan.
      </p>
    </div>
  )
}

function TeamImpact({ closedAfterNotice }) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-brand/30 bg-brand-tint px-4 py-4">
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-semibold text-brand-dark">~60 min</p>
          <p className="text-sm text-brand-dark/80">Directional time saved this week</p>
        </div>
        <div className="my-3 border-t border-brand/20" />
        <p className="text-xs text-brand-dark/80">
          ~15 min/case × 4 successfully processed cases (excludes 1 failed-parse case, which{' '}
          {closedAfterNotice > 0
            ? 'was closed with the provider notified to resubmit'
            : 'still needed manual review'}
          )
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-nurse/30 bg-nurse-tint px-4 py-4">
          <p className="text-2xl font-semibold text-nurse-dark">5</p>
          <p className="mt-1 text-sm text-nurse-dark/80">Cases processed</p>
        </div>
        <div className="rounded-lg border border-notmet-border bg-notmet-bg px-4 py-4">
          <p className="text-2xl font-semibold text-notmet">1</p>
          <p className="mt-1 text-sm text-notmet/80">Escalated to medical director</p>
        </div>
        <div className="rounded-lg border border-ambiguous-border bg-ambiguous-bg px-4 py-4">
          <p className="text-2xl font-semibold text-ambiguous">2</p>
          <p className="mt-1 text-sm text-ambiguous/80">Resolved via provider clarification</p>
        </div>
        <div className="rounded-lg border border-missing-border bg-missing-bg px-4 py-4">
          <p className="text-2xl font-semibold text-missing">~13 pages</p>
          <p className="mt-1 text-sm text-missing/80">
            Avg. packet length read manually, per case, before this tool
          </p>
        </div>
        {/* Counts only a final action that differs from the case's review-tier
            banner. Per-criterion thumbs up/down feedback is a separate signal
            and is never counted here. */}
        <div className="col-span-2 rounded-lg border border-line bg-surface px-4 py-4">
          <p className="text-2xl font-semibold text-ink">0</p>
          <p className="mt-1 text-sm text-ink-soft">Reviewer overrides of AI classification</p>
        </div>
        <div className="col-span-2 rounded-lg border border-nurse/30 bg-nurse-tint px-4 py-4">
          <p className="text-2xl font-semibold text-nurse-dark">{closedAfterNotice}</p>
          <p className="mt-1 text-sm text-nurse-dark/80">
            Closed after provider notified to resubmit (unreadable packet — administrative closure,
            not a determination)
          </p>
        </div>
      </div>

      <div className="space-y-1 text-xs text-ink-faint">
        <p>
          Time saved is directional, not measured precisely in this prototype — every case still
          ends with a human decision, not an automated one.
        </p>
        <p>Reviewer overrides are tracked as a trust signal, not a performance target.</p>
      </div>
    </div>
  )
}

function YourImpact() {
  const totalSaved = NURSE_CASES_REVIEWED * SAVED_MIN_PER_CASE
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="rounded-lg border border-brand/30 bg-brand-tint px-4 py-4">
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-semibold text-brand-dark">~{totalSaved} min</p>
            <p className="text-sm text-brand-dark/80">saved for you this week</p>
          </div>
          <div className="my-3 border-t border-brand/20" />
          <p className="text-xs text-brand-dark/80">
            Based on {NURSE_CASES_REVIEWED} cases you reviewed this week — ~{SAVED_MIN_PER_CASE} min
            saved per case, vs. an estimated ~{MANUAL_MIN_PER_CASE} min/case reading manually.
          </p>
        </div>
        <div className="rounded-lg border border-nurse/30 bg-nurse-tint px-4 py-4">
          <p className="text-2xl font-semibold text-nurse-dark">94%</p>
          <p className="mt-1 text-sm text-nurse-dark/80">Your agreement rate with AI classifications</p>
        </div>
        <div className="rounded-lg border border-missing-border bg-missing-bg px-4 py-4">
          <p className="text-2xl font-semibold text-missing">12</p>
          <p className="mt-1 text-sm text-missing/80">Source citations you personally verified</p>
        </div>
        <div className="rounded-lg border border-ambiguous-border bg-ambiguous-bg px-4 py-4">
          <p className="text-2xl font-semibold text-ambiguous">2</p>
          <p className="mt-1 text-sm text-ambiguous/80">
            of your flagged corrections were reviewed and confirmed
          </p>
          <div className="my-3 border-t border-ambiguous-border" />
          <p className="text-xs text-ambiguous/80">
            Your feedback on the length-of-stay citation last week is being incorporated into the
            next ground-truth update.
          </p>
        </div>
      </div>

      <p className="text-xs text-ink-faint">
        These numbers reflect careful review, not speed — there's no target case count, and
        reviewing thoroughly is never penalized here.
      </p>
    </div>
  )
}

export default function ReportsView({ runtime, onBack }) {
  const [activeTab, setActiveTab] = useState('team')
  const closedAfterNotice = Object.values(runtime).filter((rt) => rt.closure).length

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="flex items-end justify-between">
        <PageHeader title="Reports" subtitle={activeTab === 'patients' ? 'Live for this session.' : 'Illustrative only — not a live metric.'} />
        <button
          onClick={onBack}
          className="rounded-md border border-line px-3 py-1.5 text-sm font-medium text-ink transition hover:bg-paper"
        >
          ← Back to Queue
        </button>
      </div>

      <div className="mt-6 mb-6 flex gap-1 border-b border-line">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`border-b-2 px-3 py-2 text-sm font-medium transition ${
              activeTab === tab.key
                ? 'border-brand text-ink'
                : 'border-transparent text-ink-faint hover:text-ink'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'team' && <TeamImpact closedAfterNotice={closedAfterNotice} />}
      {activeTab === 'you' && <YourImpact />}
      {activeTab === 'patients' && <PatientEngagement runtime={runtime} />}
    </div>
  )
}
