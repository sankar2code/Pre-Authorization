import { useState } from 'react'
import Modal from './Modal'
import { generateDenialSummary } from '../data/domain'

export default function DenialModal({ open, onClose, caseData, criteria, onSubmit }) {
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
    <Modal open={open} onClose={handleClose} title="Confirm Denial">
      <div className="space-y-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">
            AI-generated summary
          </p>
          <div className="mt-1.5 whitespace-pre-line rounded-md border border-line bg-paper px-3 py-2.5 text-sm text-ink-soft">
            {open && caseData && criteria ? generateDenialSummary(caseData, criteria) : ''}
          </div>
        </div>

        <div>
          <label htmlFor="denial-comment" className="text-xs font-medium text-ink-faint">
            Your comments <span className="text-notmet">(required)</span>
          </label>
          <textarea
            id="denial-comment"
            value={comment}
            onChange={(e) => {
              setComment(e.target.value)
              if (error) setError(false)
            }}
            rows={3}
            placeholder="Explain your reasoning for the denial, for the record…"
            className={`mt-1.5 w-full rounded-md border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-none ${
              error ? 'border-notmet' : 'border-line focus:border-notmet/50'
            }`}
          />
          {error && <p className="mt-1 text-xs text-notmet">Enter a comment before denying.</p>}
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
            className="rounded-md bg-notmet px-4 py-2 text-sm font-medium text-white transition hover:brightness-90"
          >
            Submit denial
          </button>
        </div>
      </div>
    </Modal>
  )
}
