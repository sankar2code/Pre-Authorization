import { useState } from 'react'

function ThumbsUpIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path
        d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ThumbsDownIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path
        d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M17 2h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function CriterionFeedback() {
  const [vote, setVote] = useState(null) // null | 'up' | 'down'
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function handleUp() {
    setVote('up')
    setSubmitted(false)
  }

  function handleDown() {
    setVote('down')
    setSubmitted(false)
  }

  function handleSubmit() {
    if (!comment.trim()) return
    setSubmitted(true)
  }

  return (
    <div className="mt-3 border-t border-line/60 pt-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-ink-faint">Was this correct?</span>
        <button
          onClick={handleUp}
          aria-label="Thumbs up — this was correct"
          aria-pressed={vote === 'up'}
          className={`flex h-7 w-7 items-center justify-center rounded-md border transition-colors ${
            vote === 'up'
              ? 'border-met-border bg-met-bg text-met'
              : 'border-line text-ink-faint hover:border-brand/40 hover:text-ink'
          }`}
        >
          <ThumbsUpIcon className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={handleDown}
          aria-label="Thumbs down — this was wrong"
          aria-pressed={vote === 'down'}
          className={`flex h-7 w-7 items-center justify-center rounded-md border transition-colors ${
            vote === 'down'
              ? 'border-notmet-border bg-notmet-bg text-notmet'
              : 'border-line text-ink-faint hover:border-brand/40 hover:text-ink'
          }`}
        >
          <ThumbsDownIcon className="h-3.5 w-3.5" />
        </button>
        {vote === 'up' && <span className="text-xs text-met">Thanks — noted</span>}
      </div>

      {vote === 'down' && (
        <div className="mt-2">
          {submitted ? (
            <p className="text-xs text-notmet">Thanks — feedback submitted</p>
          ) : (
            <>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="What did the AI get wrong?"
                rows={2}
                className="w-full rounded-md border border-line bg-paper px-2.5 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-brand/50 focus:outline-none"
              />
              <button
                onClick={handleSubmit}
                disabled={!comment.trim()}
                className="mt-1.5 rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
              >
                Submit feedback
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
