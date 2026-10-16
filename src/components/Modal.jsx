import { useEffect } from 'react'

const MAX_WIDTH = {
  md: 'max-w-2xl',
  lg: 'max-w-5xl',
}

export default function Modal({ open, onClose, title, children, size = 'md', headerActions }) {
  useEffect(() => {
    if (!open) return
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="animate-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6"
      onClick={onClose}
    >
      <div
        className={`animate-modal-flip max-h-[85vh] w-full overflow-y-auto rounded-lg border border-line bg-surface p-5 shadow-lg ${MAX_WIDTH[size]}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-ink">{title}</h2>
          <div className="flex shrink-0 items-center gap-2">
            {headerActions}
            <button
              onClick={onClose}
              className="rounded-md px-2 py-1 text-ink-faint transition hover:bg-paper hover:text-ink"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  )
}
