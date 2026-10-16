import { useState } from 'react'
import SubmittedDocumentModal from './SubmittedDocumentModal'

export default function FailureState({ caseData, closure, onNotifyProvider, onBackToQueue }) {
  const [viewingDoc, setViewingDoc] = useState(false)
  return (
    <div className="mx-auto max-w-2xl px-6 py-16 text-center">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-notmet-bg text-notmet">
        !
      </div>
      <h1 className="mt-4 text-xl font-semibold text-ink">Unable to parse this packet</h1>
      <p className="mt-2 text-sm text-ink-soft">{caseData.failureReason}</p>

      <button
        onClick={() => setViewingDoc(true)}
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-nurse-dark underline-offset-2 hover:underline"
      >
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" className="h-4 w-4">
          <path d="M9 1.8H4.5a1.2 1.2 0 0 0-1.2 1.2v10a1.2 1.2 0 0 0 1.2 1.2H8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 1.8 12.2 5H9.6a.6.6 0 0 1-.6-.6V1.8Z" strokeLinejoin="round" />
          <circle cx="11.2" cy="10.8" r="2" />
          <path d="m12.7 12.3 1.6 1.6" strokeLinecap="round" />
        </svg>
        View submitted document
      </button>

      <div className="mt-6 rounded-lg border border-notmet-border bg-notmet-bg px-4 py-3 text-left text-sm text-notmet">
        No facts were extracted. Nothing below has been guessed or inferred — this case is routed
        to manual review rather than shown with partial or unreliable data.
      </div>

      {closure ? (
        <div className="mt-6 rounded-lg border border-nurse/30 bg-nurse-tint px-4 py-3 text-left text-sm">
          <p className="font-medium text-nurse-dark">Provider notified — case closed</p>
          <p className="mt-1 text-nurse-dark/80">
            {caseData.memberName} ({caseData.memberId}) is closed pending resubmission by the
            provider. This is an administrative closure — no AI or clinical determination has been
            made.
          </p>
        </div>
      ) : (
        <div className="mt-6 rounded-lg border border-line bg-surface px-4 py-3 text-left text-sm">
          <p className="font-medium text-ink">Routed to manual review</p>
          <p className="mt-1 text-ink-faint">
            {caseData.memberName} ({caseData.memberId}) will be read manually by a UM nurse. No
            determination has been made.
          </p>
        </div>
      )}

      <div className="mt-8 flex items-center justify-center gap-3">
        {!closure && (
          <button
            onClick={onNotifyProvider}
            className="rounded-md bg-brand px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand-dark"
          >
            Notify provider &amp; close
          </button>
        )}
        <button
          onClick={onBackToQueue}
          className="rounded-md border border-line px-5 py-2.5 text-sm font-medium text-ink transition hover:bg-paper"
        >
          ← Back to Queue
        </button>
      </div>
      <SubmittedDocumentModal open={viewingDoc} onClose={() => setViewingDoc(false)} />
    </div>
  )
}
