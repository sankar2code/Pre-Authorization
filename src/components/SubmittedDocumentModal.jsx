import Modal from './Modal'

const READABLE = 'flex items-center gap-2 rounded-md border border-met-border bg-met-bg px-3 py-2.5 text-sm font-medium text-met'

function Readable({ range }) {
  return (
    <div className={READABLE}>
      <span aria-hidden="true">✓</span>
      Pages {range} — readable
    </div>
  )
}

// View-only breakdown of the packet's scan quality. The stripe pattern is a
// CSS gradient standing in for scan degradation, not a real image.
export default function SubmittedDocumentModal({ open, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title="Submitted document">
      <div className="space-y-2 text-left">
        <Readable range="1-3" />
        <div
          className="rounded-md border border-notmet-border px-3 py-3"
          style={{
            backgroundImage:
              'repeating-linear-gradient(135deg, var(--color-notmet-bg) 0 8px, transparent 8px 16px)',
          }}
        >
          <p className="text-sm font-medium text-notmet">Pages 4-9 — illegible</p>
          <p className="mt-1 rounded bg-surface/80 px-2 py-1 text-xs text-ink-soft">
            Low-resolution scan, visible skew, compression artifacts. Text could not be reliably
            extracted from these pages.
          </p>
        </div>
        <Readable range="10-14" />
      </div>
      <p className="mt-4 text-left text-xs text-ink-faint">
        This preview reflects the actual scan quality received — nothing has been enhanced or
        guessed.
      </p>
    </Modal>
  )
}
