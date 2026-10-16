import StageIndicator from './StageIndicator'

const STAGES = [
  { key: 'sent', label: 'Sent' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'viewed', label: 'Viewed' },
  { key: 'responded', label: 'Responded' },
]

// currentStage is the most recently COMPLETED milestone — the next one
// after it is shown as "active" (in progress), matching how a package
// tracker reads: "Shipped" is a done checkmark, "In transit" is what's
// pulsing right now.
export default function StatusTimeline({ currentStage }) {
  const completedIndex = STAGES.findIndex((s) => s.key === currentStage)
  const allDone = completedIndex === STAGES.length - 1
  const progressFraction = allDone ? 1 : completedIndex / (STAGES.length - 1)

  function statusFor(i) {
    if (allDone) return i <= completedIndex ? 'done' : 'pending'
    if (i <= completedIndex) return 'done'
    if (i === completedIndex + 1) return 'active'
    return 'pending'
  }

  return (
    <div className="relative pb-1">
      <div className="absolute left-3 right-3 top-3 h-px bg-line" />
      <div
        className="absolute left-3 top-3 h-px bg-met transition-[width] duration-500"
        style={{ width: `calc(${progressFraction} * (100% - 1.5rem))` }}
      />
      <div className="relative flex justify-between">
        {STAGES.map((stage, i) => {
          const status = statusFor(i)
          return (
            <div key={stage.key} className="flex flex-col items-center gap-1.5">
              <StageIndicator status={status} className="h-6 w-6" />
              <span className={`text-xs ${status === 'pending' ? 'text-ink-faint' : 'text-ink'}`}>
                {stage.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
