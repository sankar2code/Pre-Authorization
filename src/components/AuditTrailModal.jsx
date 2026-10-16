import Modal from './Modal'
import AuditTrailTimeline from './AuditTrailTimeline'
import { DownloadIcon } from './AuditIcons'
import { downloadAuditTrailCsv } from '../data/auditExport'

export default function AuditTrailModal({ open, onClose, caseData, audit }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Audit Trail — ${caseData.memberName} (${caseData.memberId})`}
      headerActions={
        <button
          onClick={() => downloadAuditTrailCsv(caseData, audit)}
          className="flex items-center gap-1 rounded-md border border-line px-2 py-1 text-xs font-medium text-ink-faint transition hover:border-brand/40 hover:text-brand-dark"
        >
          <DownloadIcon className="h-3.5 w-3.5" />
          Export
        </button>
      }
    >
      <AuditTrailTimeline audit={audit} />
    </Modal>
  )
}
