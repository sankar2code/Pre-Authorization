import { useState } from 'react'
import Modal from './Modal'
import { generateEscalationSummary } from '../data/domain'

export default function EscalationModal({ open, onClose, caseData, criteria, onSubmit }) {
  const [observations, setObservations] = useState('')
  const [error, setError] = useState(false)

  function handleClose() {
    setObservations('')
    setError(false)
    onClose()
  }

  function handleSubmit() {
    const trimmed = observations.trim()
    if (!trimmed) {
      setError(true)
      return
    }
    onSubmit(trimmed)
    setObservations('')
    setError(false)
  }

  return (
    <Modal open={open} onClose={handleClose} title="Confirm Escalation">
      <div className="space-y-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">
            AI-generated summary
          </p>
          <div className="mt-1.5 whitespace-pre-line rounded-md border border-line bg-paper px-3 py-2.5 text-sm text-ink-soft">
            {open && caseData && criteria ? generateEscalationSummary(caseData, criteria) : ''}
          </div>
        </div>

        <div>
          <label htmlFor="escalation-observations" className="text-xs font-medium text-ink-faint">
            Your observations for the medical director <span className="text-notmet">(required)</span>
          </label>
          <textarea
            id="escalation-observations"
            value={observations}
            onChange={(e) => {
              setObservations(e.target.value)
              if (error) setError(false)
            }}
            rows={3}
            placeholder="What should the medical director know before reviewing this case?"
            className={`mt-1.5 w-full rounded-md border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-none ${
              error ? 'border-notmet' : 'border-line focus:border-brand/50'
            }`}
          />
          {error && (
            <p className="mt-1 text-xs text-notmet">Enter your observations before escalating.</p>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={handleClose}
            className="rounded-md border border-line px-4 py-2 text-sm font-medium text-ink transition hover:bg-paper"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-dark"
          >
            Submit and escalate
          </button>
        </div>
      </div>
    </Modal>
  )
}
