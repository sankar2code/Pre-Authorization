import { useState } from 'react'
import JourneyBreadcrumb from './JourneyBreadcrumb'
import AuditTrailModal from './AuditTrailModal'
import { PersonIcon, StethoscopeIcon } from './OwnerIcons'
import { HistoryIcon } from './AuditIcons'
import { deriveCaseStatus, CASE_STATUS_META } from '../data/domain'

export default function CaseHeader({ caseData, journeyStep, errorStep, rt, onBackToQueue }) {
  const [auditOpen, setAuditOpen] = useState(false)
  const owner = rt.owner
  const statusMeta = CASE_STATUS_META[deriveCaseStatus(rt)]

  return (
    <header className="border-b border-line bg-paper">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 py-4 pl-6 pr-16">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToQueue}
            className="text-sm text-ink-faint transition hover:text-ink"
          >
            ← Queue
          </button>
          <span className="h-4 w-px bg-line" />
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold text-ink">{caseData.memberName}</span>
            <span className="font-mono text-xs text-ink-faint">{caseData.memberId}</span>
          </div>
          {owner === 'md' ? (
            <span className="flex items-center gap-1 rounded-full border border-brand/30 bg-brand-tint px-2 py-0.5 text-[11px] font-medium text-brand-dark">
              <StethoscopeIcon className="h-3 w-3 shrink-0" />
              Medical Director queue
            </span>
          ) : (
            <span className="flex items-center gap-1 rounded-full border border-nurse/30 bg-nurse-tint px-2 py-0.5 text-[11px] font-medium text-nurse-dark">
              <PersonIcon className="h-3 w-3 shrink-0" />
              Nurse queue
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <JourneyBreadcrumb currentStep={journeyStep} errorStep={errorStep} />
          <button
            onClick={() => setAuditOpen(true)}
            className={`relative flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium transition hover:brightness-95 ${statusMeta.pill}`}
          >
            <HistoryIcon className="h-3 w-3 shrink-0" />
            Audit trail
            {statusMeta.pulse && (
              <span
                className={`absolute -right-0.5 -top-0.5 h-1.5 w-1.5 animate-pulse rounded-full ${statusMeta.dot}`}
              />
            )}
          </button>
        </div>
      </div>

      <AuditTrailModal
        open={auditOpen}
        onClose={() => setAuditOpen(false)}
        caseData={caseData}
        audit={rt.audit}
      />
    </header>
  )
}
