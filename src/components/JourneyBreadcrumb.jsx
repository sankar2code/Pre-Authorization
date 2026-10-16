import { JOURNEY_STEPS, JOURNEY_LABELS } from '../data/domain'

export default function JourneyBreadcrumb({ currentStep, errorStep }) {
  const currentIndex = JOURNEY_STEPS.indexOf(currentStep)

  return (
    <ol className="flex items-center gap-2">
      {JOURNEY_STEPS.map((step, i) => {
        const isError = step === errorStep
        const isCurrent = step === currentStep && !isError
        const isDone = i < currentIndex && !isError

        let dotClass = 'bg-line'
        let textClass = 'text-ink-faint'
        if (isError) {
          dotClass = 'bg-notmet'
          textClass = 'text-notmet font-medium'
        } else if (isCurrent) {
          dotClass = 'bg-brand'
          textClass = 'text-ink font-medium'
        } else if (isDone) {
          dotClass = 'bg-brand'
          textClass = 'text-ink-soft'
        }

        return (
          <li key={step} className="flex items-center gap-2">
            {i > 0 && <span className="h-px w-4 bg-line" aria-hidden="true" />}
            <span className="flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
              <span className={`text-xs tracking-wide uppercase ${textClass}`}>
                {JOURNEY_LABELS[step]}
              </span>
            </span>
          </li>
        )
      })}
    </ol>
  )
}
