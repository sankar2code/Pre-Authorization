import { useState } from 'react'
import BackButton from './BackButton'
import PageHeader from './PageHeader'
import Tooltip from './Tooltip'
import { PersonIcon, StethoscopeIcon, CalendarIcon, BoltIcon } from './OwnerIcons'
import { CASES } from '../data/cases'
import { QUEUE_TABS, deriveQueueStatus, isReadyToApprove } from '../data/domain'

const STATUS_PILL = {
  needs_action: { label: 'Needs action', className: 'bg-ambiguous-bg text-ambiguous border-ambiguous-border' },
  escalated: { label: 'Escalated', className: 'bg-notmet-bg text-notmet border-notmet-border' },
  closed: { label: 'Closed', className: 'bg-met-bg text-met border-met-border' },
}

const READY_PILL = {
  label: 'Ready to approve',
  className: 'bg-met-bg text-met border-met-border',
}

// An administrative closure (provider notified to resubmit) is not a
// determination, so its Closed pill is neutral blue rather than green.
const ADMIN_CLOSED_PILL = {
  label: 'Closed',
  className: 'bg-nurse-tint text-nurse-dark border-nurse/30',
}

const OWNER_TAG = {
  nurse: {
    label: 'Nurse queue',
    icon: PersonIcon,
    className: 'border-nurse/30 bg-nurse-tint text-nurse-dark',
  },
  md: {
    label: 'MD queue',
    icon: StethoscopeIcon,
    className: 'border-brand/30 bg-brand-tint text-brand-dark',
  },
}

// CMS decision-clock badge: standard requests have 7 days, expedited 72 hours.
function cmsTagFor(clock) {
  if (clock.type === 'expedited') {
    return {
      label: `Expedited · ${clock.hoursRemaining}h`,
      icon: BoltIcon,
      className: 'border-notmet-border bg-notmet-bg text-notmet',
    }
  }
  return {
    label: `Standard · ${clock.daysRemaining}d`,
    icon: CalendarIcon,
    className: 'border-nurse/30 bg-nurse-tint text-nurse-dark',
  }
}

export default function CaseQueue({ runtime, onOpenCase, onViewReports, onBack }) {
  const [activeTab, setActiveTab] = useState('all')

  const statuses = Object.fromEntries(CASES.map((c) => [c.id, deriveQueueStatus(runtime[c.id])]))

  const counts = {
    all: CASES.length,
    needs_action: 0,
    escalated: 0,
    closed: 0,
  }
  for (const c of CASES) counts[statuses[c.id]] += 1
  const waitingCount = counts.needs_action + counts.escalated

  // Expedited first, least hours remaining first; standard cases follow,
  // least days remaining first. Array.sort is stable, so ties keep their
  // original order.
  const urgency = (c) =>
    c.cmsClock.type === 'expedited'
      ? [0, c.cmsClock.hoursRemaining]
      : [1, c.cmsClock.daysRemaining]
  const visibleCases = CASES.filter(
    (c) => activeTab === 'all' || statuses[c.id] === activeTab,
  ).sort((a, b) => {
    const [ta, va] = urgency(a)
    const [tb, vb] = urgency(b)
    return ta - tb || va - vb
  })

  // Tooltip rows are scoped to the cases inside each tab, and only rows
  // with a non-zero count are shown — so a tab with no cases has no rows
  // and therefore no tooltip at all.
  function tooltipRowsFor(tabKey) {
    const tabCases = CASES.filter((c) => tabKey === 'all' || statuses[c.id] === tabKey)
    const count = (fn) => tabCases.filter(fn).length
    const unread = count((c) => !runtime[c.id].read)

    let rows
    if (tabKey === 'all') {
      rows = [
        ['Unread', unread],
        ['Needs action', counts.needs_action],
        ['Escalated', counts.escalated],
        ['Closed', counts.closed],
      ]
    } else if (tabKey === 'needs_action') {
      rows = [
        ['Unread', unread],
        ['Waiting for action', tabCases.length],
      ]
    } else if (tabKey === 'escalated') {
      rows = [
        ['Unread', unread],
        ['With medical director', tabCases.length],
      ]
    } else {
      rows = [
        ['Approved', count((c) => runtime[c.id].determination?.outcome === 'Approved')],
        ['Denied', count((c) => runtime[c.id].determination?.outcome === 'Denied')],
        ['Provider notified', count((c) => runtime[c.id].closure)],
      ]
    }
    return rows.filter(([, n]) => n > 0)
  }

  function tooltipFor(tabKey) {
    const rows = tooltipRowsFor(tabKey)
    if (rows.length === 0) return null
    return (
      <dl className="space-y-1">
        {rows.map(([label, n]) => (
          <div key={label} className="flex items-center justify-between gap-4">
            <dt className="text-ink-faint">{label}</dt>
            <dd className="font-medium text-ink">{n}</dd>
          </div>
        ))}
      </dl>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <BackButton onClick={onBack} label="Home" />
      <div className="flex items-end justify-between">
        <PageHeader
          title="Nurse's Case Queue"
          subtitle={`${waitingCount} ${waitingCount === 1 ? 'request' : 'requests'} awaiting review.`}
        />
        <button
          onClick={onViewReports}
          className="rounded-md border border-brand/30 bg-brand-tint px-3 py-1.5 text-sm font-medium text-brand-dark transition hover:bg-brand/10"
        >
          This week's impact →
        </button>
      </div>

      <div className="mt-6 flex gap-1 border-b border-line">
        {QUEUE_TABS.map((tab) => {
          const tabButton = (
            <button
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition ${
                activeTab === tab.key
                  ? 'border-brand text-ink'
                  : 'border-transparent text-ink-faint hover:text-ink'
              }`}
            >
              {tab.label}
              <span className="rounded-full bg-line px-1.5 py-0.5 text-xs text-ink-faint">
                {counts[tab.key]}
              </span>
            </button>
          )

          const tooltipContent = tooltipFor(tab.key)
          if (!tooltipContent) return <span key={tab.key}>{tabButton}</span>

          return (
            <Tooltip key={tab.key} content={tooltipContent}>
              {tabButton}
            </Tooltip>
          )
        })}
      </div>

      <div className="mt-4 divide-y divide-line rounded-lg border border-line bg-surface">
        {visibleCases.length === 0 && (
          <p className="px-5 py-6 text-center text-sm text-ink-faint">No cases in this view.</p>
        )}
        {visibleCases.map((c) => {
          const status = statuses[c.id]
          const pill = runtime[c.id].closure
            ? ADMIN_CLOSED_PILL
            : isReadyToApprove(runtime[c.id])
              ? READY_PILL
              : STATUS_PILL[status]
          const unread = !runtime[c.id].read
          const ownerTag = status !== 'closed' ? OWNER_TAG[runtime[c.id].owner] : null
          const cmsTag = cmsTagFor(c.cmsClock)
          return (
            <button
              key={c.id}
              onClick={() => onOpenCase(c.id)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-paper"
            >
              <div>
                <div className="flex items-baseline gap-2">
                  {unread && (
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-label="Unread" />
                  )}
                  <span className="text-sm font-semibold text-ink">{c.memberName}</span>
                  <span className="font-mono text-xs text-ink-faint">{c.memberId}</span>
                </div>
                <p className="mt-0.5 text-sm text-ink-soft">{c.procedure}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span
                  className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${cmsTag.className}`}
                >
                  <cmsTag.icon className="h-3 w-3 shrink-0" />
                  {cmsTag.label}
                </span>
                {ownerTag && (
                  <span
                    className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${ownerTag.className}`}
                  >
                    <ownerTag.icon className="h-3 w-3 shrink-0" />
                    {ownerTag.label}
                  </span>
                )}
                <span
                  className={`rounded-full border px-2 py-0.5 text-xs font-medium ${pill.className}`}
                >
                  {pill.label}
                </span>
                <span className="text-ink-faint">→</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
