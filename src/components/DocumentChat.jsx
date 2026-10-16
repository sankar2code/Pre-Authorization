import { useEffect, useRef, useState } from 'react'
import { answerPacketQuestion, SUGGESTED_QUESTIONS } from '../data/packetChat'
import { openPacketWindowAt } from '../data/packet'

function ChatIcon(props) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" {...props}>
      <path
        d="M2 3.5h12a.8.8 0 0 1 .8.8v6.4a.8.8 0 0 1-.8.8H6.3L3 14.5v-3H2a.8.8 0 0 1-.8-.8V4.3A.8.8 0 0 1 2 3.5Z"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function INITIAL_MESSAGES() {
  return [
    {
      role: 'answer',
      text: 'Ask a question about this packet — comorbidities, clearances, expected stay, labs, and more.',
    },
  ]
}

export default function DocumentChat() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState(INITIAL_MESSAGES)
  const [draft, setDraft] = useState('')
  const logRef = useRef(null)

  useEffect(() => {
    if (!open) return
    function onKeyDown(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight })
  }, [messages])

  function ask(question) {
    const q = question.trim()
    if (!q) return
    const { answer, page, quote } = answerPacketQuestion(q)
    setMessages((prev) => [
      ...prev,
      { role: 'question', text: q },
      { role: 'answer', text: answer, page, quote },
    ])
    setDraft('')
  }

  function handleSubmit(e) {
    e.preventDefault()
    ask(draft)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex shrink-0 items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink transition hover:bg-paper"
      >
        <ChatIcon className="h-3.5 w-3.5 shrink-0" />
        Ask about this document
      </button>

      {open && (
        <div className="fixed inset-0 z-50" onClick={() => setOpen(false)}>
          <div
            className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col border-l border-line bg-surface shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Ask about this document"
          >
            <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
              <h2 className="text-sm font-semibold text-ink">Ask about this document</h2>
              <button
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-1 text-ink-faint transition hover:bg-paper hover:text-ink"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 px-4 pt-3">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => ask(q)}
                  className="rounded-full border border-line bg-paper px-2.5 py-1 text-[11px] text-ink-soft transition hover:bg-line/40"
                >
                  {q}
                </button>
              ))}
            </div>

            <div ref={logRef} className="mt-3 flex-1 space-y-2.5 overflow-y-auto px-4 pb-3">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'question' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[88%] rounded-lg px-3 py-2 text-sm leading-snug ${
                      m.role === 'question'
                        ? 'rounded-br-sm bg-brand text-white'
                        : 'rounded-bl-sm bg-paper text-ink'
                    }`}
                  >
                    {m.text}
                    {m.page && (
                      <button
                        onClick={() => openPacketWindowAt(m.page, m.quote, 'Ask about this document')}
                        className="mt-1.5 block text-xs text-brand-dark underline hover:no-underline"
                      >
                        View on page {m.page} →
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="flex gap-2 border-t border-line px-4 py-3">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                type="text"
                placeholder="Ask a question…"
                autoComplete="off"
                className="flex-1 rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-brand"
              />
              <button
                type="submit"
                className="shrink-0 rounded-md bg-brand px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-dark"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
