import { openPacketWindow } from '../data/packet'

function FileTextIcon(props) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" {...props}>
      <path d="M4 1.5h5.5L12.5 4.5V14.5H4z" strokeLinejoin="round" />
      <path d="M9.5 1.5V4.5h3" strokeLinejoin="round" />
      <path d="M5.8 8h4.4M5.8 10.2h4.4M5.8 12.4h2.8" strokeLinecap="round" />
    </svg>
  )
}

export default function PacketButton({ pages }) {
  return (
    <button
      onClick={() => openPacketWindow()}
      className="flex shrink-0 items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink transition hover:bg-paper"
    >
      <FileTextIcon className="h-3.5 w-3.5 shrink-0" />
      View source packet · {pages} pages
    </button>
  )
}
