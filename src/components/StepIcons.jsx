// Small line icons for the Before State's severity-coded step rows. All share
// the 16px viewBox / 1.3 stroke used by the rest of the app's icons.
function Icon({ children, ...props }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  )
}

export const FaxIcon = (p) => (
  <Icon {...p}>
    <path d="M4.5 5.5V2h7v3.5" />
    <rect x="1.8" y="5.5" width="12.4" height="6" rx="1.2" />
    <path d="M4.5 9.5h7v4.5h-7z" />
    <path d="M11.6 7.6h.01" />
  </Icon>
)

export const EyeSearchIcon = (p) => (
  <Icon {...p}>
    <path d="M1 7.2S3.2 3.4 7 3.4s6 3.8 6 3.8-2.2 3.8-6 3.8S1 7.2 1 7.2Z" />
    <circle cx="7" cy="7.2" r="1.6" />
    <path d="m11.2 11.4 3.2 3.2" />
  </Icon>
)

export const ClipboardCheckIcon = (p) => (
  <Icon {...p}>
    <rect x="3" y="2.4" width="10" height="11.8" rx="1.2" />
    <rect x="6" y="1.2" width="4" height="2.2" rx="0.6" />
    <path d="m5.7 9 1.6 1.6 3-3.4" />
  </Icon>
)

export const HelpCircleIcon = (p) => (
  <Icon {...p}>
    <circle cx="8" cy="8" r="6.2" />
    <path d="M6.2 6.3a1.9 1.9 0 0 1 3.6.7c0 1.3-1.8 1.4-1.8 2.6" />
    <path d="M8 11.6h.01" />
  </Icon>
)

export const PauseIcon = (p) => (
  <Icon {...p}>
    <circle cx="8" cy="8" r="6.2" />
    <path d="M6.4 5.8v4.4M9.6 5.8v4.4" />
  </Icon>
)

export const RepeatIcon = (p) => (
  <Icon {...p}>
    <path d="M2.4 7V6a2 2 0 0 1 2-2h8.4M10.6 1.8 12.8 4l-2.2 2.2" />
    <path d="M13.6 9v1a2 2 0 0 1-2 2H3.2M5.4 14.2 3.2 12l2.2-2.2" />
  </Icon>
)

export const AlertTriangleIcon = (p) => (
  <Icon {...p}>
    <path d="M8 1.8 14.6 13.4H1.4L8 1.8Z" />
    <path d="M8 6.4v3.2M8 11.5h.01" />
  </Icon>
)

export const DocumentStackIcon = (p) => (
  <Icon {...p}>
    <path d="M5 3.2V2.4a1 1 0 0 1 1-1h6.6a1 1 0 0 1 1 1v8.2a1 1 0 0 1-1 1h-.8" />
    <rect x="2.4" y="4.2" width="8.4" height="10.2" rx="1" />
    <path d="M4.6 7.4h4M4.6 9.8h4M4.6 12h2.4" />
  </Icon>
)

export const PuzzleIcon = (p) => (
  <Icon {...p}>
    <path d="M6.2 2.6a1.4 1.4 0 0 1 2.8 0v.9h3a.8.8 0 0 1 .8.8v2.6h-.9a1.4 1.4 0 0 0 0 2.8h.9v2.3a.8.8 0 0 1-.8.8H9.4v-.9a1.4 1.4 0 0 0-2.8 0v.9H3.6a.8.8 0 0 1-.8-.8V4.3a.8.8 0 0 1 .8-.8h2.6v-.9Z" />
  </Icon>
)

export const SparklesIcon = (p) => (
  <Icon {...p}>
    <path d="M6.4 2.2 7.6 5.6l3.4 1.2-3.4 1.2-1.2 3.4L5.2 8 1.8 6.8l3.4-1.2 1.2-3.4Z" />
    <path d="M12 9.6l.6 1.6 1.6.6-1.6.6-.6 1.6-.6-1.6-1.6-.6 1.6-.6.6-1.6Z" />
  </Icon>
)

export const DatabaseSearchIcon = (p) => (
  <Icon {...p}>
    <ellipse cx="6.6" cy="3.6" rx="4.4" ry="1.8" />
    <path d="M2.2 3.6v7.2c0 1 2 1.8 4.4 1.8M2.2 7.2c0 1 2 1.8 4.4 1.8" />
    <path d="M11 3.6v3" />
    <circle cx="10.8" cy="10.4" r="2" />
    <path d="m12.3 11.9 1.9 1.9" />
  </Icon>
)

export const ListCheckIcon = (p) => (
  <Icon {...p}>
    <path d="m1.8 3.8 1.1 1.1 1.9-2M1.8 9.6l1.1 1.1 1.9-2" />
    <path d="M7.4 4h6.8M7.4 9.8h6.8M7.4 13.2h6.8" />
  </Icon>
)

export const FileCheckIcon = (p) => (
  <Icon {...p}>
    <path d="M9.2 1.8H4.4a1.2 1.2 0 0 0-1.2 1.2v10a1.2 1.2 0 0 0 1.2 1.2h7.2a1.2 1.2 0 0 0 1.2-1.2V5.4L9.2 1.8Z" />
    <path d="M9.2 1.8v3.6h3.6" />
    <path d="m5.8 9.6 1.5 1.5 2.9-3" />
  </Icon>
)

export const FileXIcon = (p) => (
  <Icon {...p}>
    <path d="M9.2 1.8H4.4a1.2 1.2 0 0 0-1.2 1.2v10a1.2 1.2 0 0 0 1.2 1.2h7.2a1.2 1.2 0 0 0 1.2-1.2V5.4L9.2 1.8Z" />
    <path d="M9.2 1.8v3.6h3.6" />
    <path d="m6.2 8.4 3.6 3.6M9.8 8.4l-3.6 3.6" />
  </Icon>
)

export const CheckCircleIcon = (p) => (
  <Icon {...p}>
    <circle cx="8" cy="8" r="6.2" />
    <path d="m5.2 8.2 1.9 1.9 3.6-3.9" />
  </Icon>
)

export const MessageQuestionIcon = (p) => (
  <Icon {...p}>
    <path d="M2.2 3.2a1.2 1.2 0 0 1 1.2-1.2h9.2a1.2 1.2 0 0 1 1.2 1.2v6.4a1.2 1.2 0 0 1-1.2 1.2H6.4L3.4 13.6v-2.8a1.2 1.2 0 0 1-1.2-1.2V3.2Z" />
    <path d="M6.6 5.4a1.5 1.5 0 0 1 2.9.5c0 1-1.5 1.1-1.5 2M8 8.9h.01" />
  </Icon>
)

export const ArrowUpCircleIcon = (p) => (
  <Icon {...p}>
    <circle cx="8" cy="8" r="6.2" />
    <path d="M8 11V5.4M5.6 7.6 8 5.2l2.4 2.4" />
  </Icon>
)

export const HeartPulseIcon = (p) => (
  <Icon {...p}>
    <path d="M8 13.6S1.8 10 1.8 5.9A3.1 3.1 0 0 1 8 4.5a3.1 3.1 0 0 1 6.2 1.4c0 4.1-6.2 7.7-6.2 7.7Z" />
    <path d="M3.6 8h2.2l1-1.8 1.6 3.4 1-1.6h2.4" />
  </Icon>
)
