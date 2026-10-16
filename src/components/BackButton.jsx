function ArrowLeftIcon(props) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" {...props}>
      <path d="M13 8H3M3 8l4.5-4.5M3 8l4.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function BackButton({ onClick, label = 'Back' }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="fixed top-4 left-4 z-30 flex h-9 items-center gap-1.5 rounded-full border border-line bg-surface px-3 text-sm text-ink-faint shadow-sm transition hover:text-ink"
    >
      <ArrowLeftIcon className="h-3.5 w-3.5" />
      {label}
    </button>
  )
}
