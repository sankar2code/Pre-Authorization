import { useState } from 'react'
import { HelpIcon, LockIcon } from './PatientIcons'

export function Card({ title, children, className = '', tone }) {
  const toneClass = {
    info: 'border-nurse/30 bg-nurse-tint',
    warn: 'border-ambiguous-border bg-ambiguous-bg',
    good: 'border-met-border bg-met-bg',
    bad: 'border-notmet-border bg-notmet-bg',
  }[tone] ?? 'border-line bg-surface'
  return (
    <section className={`rounded-xl border px-4 py-4 sm:px-5 ${toneClass} ${className}`}>
      {title && <h2 className="text-sm font-semibold text-ink">{title}</h2>}
      <div className={title ? 'mt-3' : ''}>{children}</div>
    </section>
  )
}

export function PrimaryButton({ children, className = '', ...props }) {
  return (
    <button
      {...props}
      className={`rounded-md bg-nurse px-4 py-2.5 text-sm font-medium text-white transition hover:bg-nurse-dark disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  )
}

export function SecondaryButton({ children, className = '', ...props }) {
  return (
    <button
      {...props}
      className={`rounded-md border border-line bg-surface px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-paper disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  )
}

// A selectable option card used for payment choices and decline reasons.
export function OptionCard({ selected, onSelect, title, detail, name }) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3.5 py-3 transition ${
        selected ? 'border-nurse bg-nurse-tint' : 'border-line bg-surface hover:bg-paper'
      }`}
    >
      <input type="radio" name={name} checked={selected} onChange={onSelect} className="mt-0.5 accent-[var(--color-nurse)]" />
      <span>
        <span className="block text-sm font-medium text-ink">{title}</span>
        {detail && <span className="mt-0.5 block text-xs text-ink-soft">{detail}</span>}
      </span>
    </label>
  )
}

// Plain-language definition for a cost term. Opens on hover and on tap, so
// it works without a mouse; the text wraps, unlike the nurse-side Tooltip.
export function TermHelp({ text, label }) {
  const [open, setOpen] = useState(false)
  return (
    <span className="relative inline-flex" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setOpen(false)}
        aria-label={label}
        aria-expanded={open}
        className="flex h-5 w-5 items-center justify-center rounded-full text-ink-faint transition hover:text-nurse-dark"
      >
        <HelpIcon className="h-3.5 w-3.5" />
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute bottom-full left-1/2 z-20 mb-1.5 w-64 -translate-x-1/2 rounded-md border border-line bg-surface px-3 py-2 text-xs leading-relaxed text-ink-soft shadow-lg"
        >
          {text}
        </span>
      )}
    </span>
  )
}

export function LockedPanel({ text }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-line bg-surface px-6 py-12 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-paper text-ink-faint">
        <LockIcon className="h-4 w-4" />
      </span>
      <p className="mt-3 text-sm text-ink-soft">{text}</p>
    </div>
  )
}

export function Select({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-ink-soft">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-nurse focus:outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}
