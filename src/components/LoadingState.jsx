import { useEffect, useRef, useState } from 'react'
import StageIndicator from './StageIndicator'

const STAGES = [
  {
    title: 'Parsing document',
    detail: (caseData) => `Reading ${caseData.packetPages} pages`,
    duration: 800,
  },
  {
    title: 'Extracting clinical facts',
    detail: () => 'Procedure, comorbidities, clearance, length of stay',
    duration: 1000,
  },
  {
    title: 'Retrieving coverage criteria',
    detail: () => 'NCD → LCD → Payer policy → MCG',
    duration: 1200,
  },
  {
    title: 'Matching against criteria',
    detail: () => 'Comparing extracted facts to requirements',
    duration: 1000,
  },
  {
    title: 'Checking confidence per criterion',
    detail: () => 'Flagging anything ambiguous or missing',
    duration: 1000,
  },
  {
    title: 'Preparing case view',
    detail: () => 'Building checklist and citations',
    duration: 500,
  },
]


export default function LoadingState({ caseData, onComplete }) {
  const [completedCount, setCompletedCount] = useState(0)
  const [failedIndex, setFailedIndex] = useState(null)

  // Keep the latest onComplete without making it a timer-scheduling dependency
  // — a parent re-render (e.g. toggling dark mode) shouldn't restart the clock.
  const onCompleteRef = useRef(onComplete)
  useEffect(() => {
    onCompleteRef.current = onComplete
  })

  useEffect(() => {
    const isFailure = caseData.parseFailed
    const stagesToRun = isFailure ? STAGES.slice(0, 1) : STAGES
    const timers = []
    let elapsed = 0

    stagesToRun.forEach((stage, i) => {
      elapsed += stage.duration
      const isLastStage = i === stagesToRun.length - 1
      timers.push(
        setTimeout(() => {
          if (isFailure && isLastStage) {
            setFailedIndex(i)
          } else {
            setCompletedCount(i + 1)
          }
        }, elapsed),
      )
    })

    const finalDelay = elapsed + (isFailure ? 500 : 300)
    timers.push(setTimeout(() => onCompleteRef.current(), finalDelay))

    return () => timers.forEach(clearTimeout)
    // Deliberately keyed on caseData.id alone: parseFailed is fixed per case,
    // and depending on the whole caseData object would restart this timer
    // chain on every unrelated parent re-render (e.g. the dark-mode toggle).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseData.id])

  const rowStatus = (i) => {
    if (failedIndex === i) return 'failed'
    if (i < completedCount) return 'done'
    if (i === completedCount && failedIndex === null) return 'active'
    return 'pending'
  }

  // Once every stage is done, keep showing the last stage's heading (rather
  // than flash a transient "ready" state) until onComplete swaps the screen.
  const currentIndex = failedIndex ?? Math.min(completedCount, STAGES.length - 1)
  const headingTitle = STAGES[currentIndex].title
  const headingDetail = STAGES[currentIndex].detail(caseData)

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <p className="text-center text-xs text-ink-faint">
        {caseData.memberName} ({caseData.memberId})
      </p>
      <h1
        className={`mt-2 text-center text-xl font-semibold transition-colors ${
          failedIndex !== null ? 'text-notmet' : 'text-ink'
        }`}
      >
        {headingTitle}
      </h1>
      <p className="mt-1 text-center text-sm text-ink-faint">{headingDetail}</p>

      <ol className="mt-8 space-y-4">
        {STAGES.map((stage, i) => {
          const status = rowStatus(i)
          return (
            <li key={stage.title} className="flex items-start gap-3">
              <StageIndicator status={status} />
              <div>
                <p
                  className={`text-sm font-medium ${
                    status === 'pending' ? 'text-ink-faint' : 'text-ink'
                  }`}
                >
                  {stage.title}
                </p>
                <p className="text-xs text-ink-faint">{stage.detail(caseData)}</p>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
