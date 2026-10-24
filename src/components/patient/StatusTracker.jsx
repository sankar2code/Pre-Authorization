import { CheckIcon, CrossIcon } from './PatientIcons'

const DOT = {
  done: 'border-met bg-met text-white',
  current: 'border-nurse bg-nurse-tint text-nurse-dark ring-4 ring-nurse/15',
  currentWarn: 'border-ambiguous bg-ambiguous-bg text-ambiguous ring-4 ring-ambiguous/15',
  upcoming: 'border-line bg-surface text-ink-faint',
  skipped: 'border-dashed border-line bg-surface text-ink-faint',
  denied: 'border-notmet bg-notmet text-white',
}

const LABEL = {
  done: 'text-ink',
  current: 'font-semibold text-nurse-dark',
  currentWarn: 'font-semibold text-ambiguous',
  upcoming: 'text-ink-faint',
  skipped: 'text-ink-faint line-through decoration-ink-faint/50',
  denied: 'font-semibold text-notmet',
}

// The five-step tracker: horizontal on wide screens, a vertical list on
// phones so step labels never get squeezed.
export default function StatusTracker({ steps, fmt }) {
  return (
    <ol className="flex flex-col gap-3 sm:flex-row sm:gap-0" aria-label={fmt.t('statusTitle')}>
      {steps.map((step, i) => {
        const look = step.state === 'current' && step.key === 'info' ? 'currentWarn' : step.state
        const last = i === steps.length - 1
        return (
          <li key={step.key} className="relative flex items-center gap-3 sm:flex-1 sm:flex-col sm:items-center sm:gap-2 sm:text-center">
            {!last && (
              <span
                aria-hidden
                className={`absolute hidden sm:block top-3.5 left-1/2 h-0.5 w-full ${step.state === 'done' ? 'bg-met' : 'bg-line'}`}
              />
            )}
            {!last && (
              <span
                aria-hidden
                className={`absolute left-3.5 top-7 h-3 w-0.5 sm:hidden ${step.state === 'done' ? 'bg-met' : 'bg-line'}`}
              />
            )}
            <span
              className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold ${DOT[look]}`}
            >
              {step.state === 'done' ? (
                <CheckIcon className="h-3.5 w-3.5" />
              ) : step.state === 'denied' ? (
                <CrossIcon className="h-3.5 w-3.5" />
              ) : (
                i + 1
              )}
            </span>
            <span className="sm:px-1">
              <span className={`block text-[13px] leading-snug ${LABEL[look]}`}>{fmt.t(step.label)}</span>
              {step.state === 'current' && (
                <span className="mt-0.5 block text-[11px] font-medium uppercase tracking-wide text-ink-faint">
                  {fmt.t('stepNow')}
                </span>
              )}
              {step.state === 'skipped' && (
                <span className="mt-0.5 block text-[11px] text-ink-faint">{fmt.t('stepNotNeeded')}</span>
              )}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
