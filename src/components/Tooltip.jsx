export default function Tooltip({ content, children, className = '' }) {
  return (
    <span className={`group relative inline-flex ${className}`}>
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 w-max min-w-28 -translate-x-1/2 whitespace-nowrap rounded-md border border-line bg-surface px-2.5 py-2 text-xs text-ink-soft opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100"
      >
        {content}
      </span>
    </span>
  )
}
