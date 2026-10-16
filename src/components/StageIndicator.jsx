export default function StageIndicator({ status, className = 'h-5 w-5' }) {
  if (status === 'done') {
    return (
      <span className={`flex shrink-0 items-center justify-center rounded-full bg-met ${className}`}>
        <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="white" strokeWidth="1.8">
          <path d="M2.5 6.2l2.2 2.2 4.8-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    )
  }
  if (status === 'failed') {
    return (
      <span className={`flex shrink-0 items-center justify-center rounded-full bg-notmet ${className}`}>
        <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="white" strokeWidth="1.8">
          <path d="M3 3l6 6M9 3l-6 6" strokeLinecap="round" />
        </svg>
      </span>
    )
  }
  if (status === 'active') {
    return (
      <span className={`relative flex shrink-0 items-center justify-center ${className}`}>
        <span className="absolute inset-0 animate-ping rounded-full bg-brand/40" />
        <span className="relative h-2.5 w-2.5 rounded-full bg-brand" />
      </span>
    )
  }
  return <span className={`shrink-0 rounded-full border-2 border-line ${className}`} />
}
