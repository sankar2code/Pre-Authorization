import Modal from './Modal'

// Pinned to explicit light colors rather than the theme tokens — same
// reasoning as WorkflowDiagram: a mock scanned/printed page reads as a
// physical page regardless of the app's light/dark theme.
export default function CitationViewerModal({ open, onClose, title, sublabel, highlightCaption, highlightText }) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="rounded-md border border-[#e4e3df] bg-white p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-[#8a8a86]">{sublabel}</p>

        <div className="mt-4 space-y-2">
          <div className="h-2 w-full rounded bg-[#e4e3df]" />
          <div className="h-2 w-11/12 rounded bg-[#e4e3df]" />
          <div className="h-2 w-4/5 rounded bg-[#e4e3df]" />
        </div>

        <div className="my-4 rounded-md border border-[#f0dca0] bg-[#fdf3d8] px-3 py-2.5">
          <p className="text-xs font-medium text-[#9a6700]">{highlightCaption}</p>
          <p className="mt-1 text-sm italic text-[#2c2c2a]">&ldquo;{highlightText}&rdquo;</p>
        </div>

        <div className="space-y-2">
          <div className="h-2 w-full rounded bg-[#e4e3df]" />
          <div className="h-2 w-3/4 rounded bg-[#e4e3df]" />
        </div>
      </div>
    </Modal>
  )
}
