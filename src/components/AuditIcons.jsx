export function HistoryIcon(props) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" {...props}>
      <path d="M2.5 5.5A5.7 5.7 0 1 1 2.2 9" strokeLinecap="round" />
      <path d="M2.2 2.6v3h3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 5.2v3.1l2.2 1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// Filled flag — deliberately not a checkmark, so a final determination
// reads as a distinct outcome milestone rather than just another
// completed step in the timeline.
export function FlagIcon(props) {
  return (
    <svg viewBox="0 0 16 16" {...props}>
      <path d="M3.5 1.2v13.6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" fill="none" />
      <path
        d="M4.3 2.1c1.6-.9 3.2.9 4.8 0s2.4.8 3.4.1v5.1c-1 .7-2-1-3.4-.1s-3.2-.9-4.8 0V2.1z"
        fill="currentColor"
      />
    </svg>
  )
}

export function XIcon(props) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
    </svg>
  )
}

export function DownloadIcon(props) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" {...props}>
      <path d="M8 1.8v8.2M5.2 7.2 8 10l2.8-2.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2.5 11v1.7a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1V11" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// Envelope — marks the administrative "provider notified" closure, which
// is a notification, not an outcome, so it never borrows the flag.
export function MailIcon(props) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" {...props}>
      <rect x="2" y="3.5" width="12" height="9" rx="1.5" />
      <path d="M2.5 4.5 8 9l5.5-4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
