// Small stroke icons for the patient portal, drawn on the same 16px grid
// and 1.3–1.4 stroke weight as the nurse-side icons.
const base = { viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round', strokeLinejoin: 'round' }

export function BellIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 11.5V7a4 4 0 0 1 8 0v4.5l1 1.5H3z" />
      <path d="M6.6 14a1.5 1.5 0 0 0 2.8 0" />
    </svg>
  )
}

export function SpeakerIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M2.5 6v4h2.5L8.5 13V3L5 6z" />
      <path d="M11 5.5a3.5 3.5 0 0 1 0 5M12.8 3.8a6 6 0 0 1 0 8.4" />
    </svg>
  )
}

export function StopIcon(props) {
  return (
    <svg {...base} {...props}>
      <rect x="4" y="4" width="8" height="8" rx="1.2" />
    </svg>
  )
}

export function LockIcon(props) {
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="7" width="9" height="6.5" rx="1.2" />
      <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
    </svg>
  )
}

export function CheckIcon(props) {
  return (
    <svg {...base} strokeWidth={1.8} {...props}>
      <path d="M3.5 8.5l3 3 6-7" />
    </svg>
  )
}

export function CrossIcon(props) {
  return (
    <svg {...base} strokeWidth={1.8} {...props}>
      <path d="M4.5 4.5l7 7M11.5 4.5l-7 7" />
    </svg>
  )
}

export function ClockIcon(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="8" cy="8" r="6" />
      <path d="M8 4.8V8l2.2 1.4" />
    </svg>
  )
}

export function CalendarPlusIcon(props) {
  return (
    <svg {...base} {...props}>
      <rect x="2.5" y="3.5" width="11" height="10" rx="1.2" />
      <path d="M2.5 6.5h11M5.5 2v3M10.5 2v3M8 8.5v3.5M6.25 10.25h3.5" />
    </svg>
  )
}

export function ChatIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M2.5 4a1.5 1.5 0 0 1 1.5-1.5h8A1.5 1.5 0 0 1 13.5 4v5.5A1.5 1.5 0 0 1 12 11H7l-3 2.5V11a1.5 1.5 0 0 1-1.5-1.5z" />
    </svg>
  )
}

export function PhoneIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M4.5 2.5h2l1 3-1.5 1a7 7 0 0 0 3.5 3.5l1-1.5 3 1v2a1.5 1.5 0 0 1-1.5 1.5A10 10 0 0 1 3 4a1.5 1.5 0 0 1 1.5-1.5z" />
    </svg>
  )
}

export function DocIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 1.5h5.5L12.5 4.5V14.5H4z" />
      <path d="M9.5 1.5V4.5h3M5.8 8h4.4M5.8 10.2h4.4" />
    </svg>
  )
}

export function HelpIcon(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="8" cy="8" r="6" />
      <path d="M6.3 6.3a1.8 1.8 0 1 1 2.5 1.7c-.5.2-.8.6-.8 1.1v.4M8 11.6v.1" />
    </svg>
  )
}
