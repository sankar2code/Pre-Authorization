import { useState } from 'react'
import Modal from './Modal'
import { generateFailureClosureSummary } from '../data/domain'

export default function NotifyProviderModal({ open, onClose, caseData, onSubmit }) {
  const [comment, setComment] = useState('')
  const [error, setError] = useState(false)

  function handleClose() {
    setComment('')
    setError(false)
    onClose()
  }

  function handleSubmit() {
    const trimmed = comment.trim()
    if (!trimmed) {
      setError(true)
      return
    }
    onSubmit(trimmed)
    setComment('')
    setError(false)
  }

  return (
    <Modal open={open} onClose={handleClose} title="Notify Provider & Close Case">
      <div className="space-y-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">
            AI-generated summary
          </p>
          <div className="mt-1.5 whitespace-pre-line rounded-md border border-line bg-paper px-3 py-2.5 text-sm text-ink-soft">
            {open && caseData ? generateFailureClosureSummary(caseData) : ''}
          </div>
        </div>

        <div>
          <label htmlFor="notify-provider-comment" className="text-xs font-medium text-ink-faint">
            Your justification <span className="text-notmet">(required)</span>
          </label>
          <textarea
            id="notify-provider-comment"
            value={comment}
            onChange={(e) => {
              setComment(e.target.value)
              if (error) setError(false)
            }}
            rows={3}
            placeholder="Explain why this case is closing and what the provider needs to resubmit..."
            className={`mt-1.5 w-full rounded-md border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-none ${
              error ? 'border-notmet' : 'border-line focus:border-brand/50'
            }`}
          />
          {error && (
            <p className="mt-1 text-xs text-notmet">Enter a justification before closing this case.</p>
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
            Notify provider &amp; close
          </button>
        </div>
      </div>
    </Modal>
  )
}
