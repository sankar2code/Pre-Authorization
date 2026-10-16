import { useState } from 'react'
import Modal from './Modal'
import WorkflowDiagram from './WorkflowDiagram'
import {
  FaxIcon,
  EyeSearchIcon,
  ClipboardCheckIcon,
  HelpCircleIcon,
  PauseIcon,
  RepeatIcon,
  AlertTriangleIcon,
  DocumentStackIcon,
  PuzzleIcon,
  SparklesIcon,
  DatabaseSearchIcon,
  ListCheckIcon,
  FileCheckIcon,
  FileXIcon,
  CheckCircleIcon,
  MessageQuestionIcon,
  ArrowUpCircleIcon,
  HeartPulseIcon,
} from './StepIcons'
import { FlagIcon } from './AuditIcons'
import { BoltIcon, StethoscopeIcon } from './OwnerIcons'
import { CURRENT_FLOW_DEFINITION, FUTURE_FLOW_DEFINITION } from '../data/workflowDiagrams'

function FlowIcon(props) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" {...props}>
      <rect x="1" y="1.2" width="5" height="3.2" rx="0.7" />
      <rect x="10" y="1.2" width="5" height="3.2" rx="0.7" />
      <rect x="5.5" y="11.6" width="5" height="3.2" rx="0.7" />
      <path d="M3.5 4.4v2a1 1 0 0 0 1 1H7" strokeLinecap="round" />
      <path d="M12.5 4.4v2a1 1 0 0 1-1 1H8" strokeLinecap="round" />
      <path d="M8 7.4v4.2" strokeLinecap="round" />
    </svg>
  )
}

function ClipboardIcon(props) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" {...props}>
      <rect x="3" y="2" width="10" height="12" rx="1.2" />
      <rect x="6" y="0.8" width="4" height="1.8" rx="0.5" />
      <path d="M5.6 8.4l1.5 1.5 3.3-3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// Severity, not decoration: the badge color escalates gray -> amber -> red so
// the progression itself shows the manual process getting worse.
const TONE = {
  routine: 'border-missing-border bg-missing-bg text-missing',
  warning: 'border-ambiguous-border bg-ambiguous-bg text-ambiguous',
  critical: 'border-notmet-border bg-notmet-bg text-notmet',
  accent: 'border-nurse/30 bg-nurse-tint text-nurse-dark',
  success: 'border-met-border bg-met-bg text-met',
  escalated: 'border-escalated-border bg-escalated-bg text-escalated',
}

const CURRENT_STEPS = [
  { icon: FaxIcon, tone: 'routine', text: 'Request and 14-page packet arrive by fax or portal.' },
  {
    icon: EyeSearchIcon,
    tone: 'routine',
    text: 'The nurse reads all 14 pages to find comorbidities, cardiology clearance and expected length of stay, each in a different section.',
  },
  {
    icon: ClipboardCheckIcon,
    tone: 'routine',
    text: 'The nurse checks each fact against the inpatient level-of-care criteria (NCD → LCD → Payer policy → MCG) from memory or separate lookups.',
  },
  {
    icon: HelpCircleIcon,
    tone: 'warning',
    text: 'A required fact, like expected length of stay, is implied but never clearly documented.',
  },
  {
    icon: PauseIcon,
    tone: 'critical',
    text: "The nurse can't confirm the criterion, so the case is pended.",
  },
  {
    icon: RepeatIcon,
    tone: 'critical',
    text: 'The hospital and plan trade faxes to resolve one detail a cleaner read could have settled in minutes.',
  },
  {
    icon: AlertTriangleIcon,
    tone: 'critical',
    text: 'The admission date is at risk. The manual burden is the same whether the case is hard or clear-cut.',
  },
]

const CURRENT_OTHER_PATHS = [
  {
    icon: DocumentStackIcon,
    label: 'Clean, complete packet',
    detail: "Still costs a full manual read. Nobody knows it was easy until they've read all of it.",
  },
  {
    icon: PuzzleIcon,
    label: 'Multiple missing facts',
    detail: 'Each gap means another fax round, so delays stack up.',
  },
  {
    icon: HeartPulseIcon,
    badge: true,
    label: "This isn't paperwork delay — it's someone's life on hold.",
    detail:
      "CMS gives Expedited cases 72 hours because delay can harm a patient. Every hour spent reading a packet by hand comes off that clock.",
  },
]

// Same four-color language as the Audit Trail and Case Queue badges:
// green = clean, amber = needs clarification, orange = with the medical
// director, red = unreadable.
const FUTURE_OTHER_PATHS = [
  {
    icon: CheckCircleIcon,
    tone: 'success',
    label: 'All criteria clearly met',
    detail: 'Straight-through approval, lighter-touch review.',
  },
  {
    icon: MessageQuestionIcon,
    tone: 'warning',
    label: 'One ambiguous fact',
    detail: 'Clarification sent to the provider, resolved, then approved.',
  },
  {
    icon: ArrowUpCircleIcon,
    tone: 'escalated',
    label: 'Multiple ambiguous facts',
    detail: 'Escalates to a medical director, resolved, then approved.',
  },
  {
    icon: FileXIcon,
    tone: 'critical',
    label: "Packet can't be parsed",
    detail: 'Routed to manual review, no guessing.',
  },
]

const FUTURE_STEPS = [
  { icon: FaxIcon, tone: 'routine', text: 'Same intake point. Requests arrive the way they do today.' },
  {
    icon: SparklesIcon,
    tone: 'accent',
    text: 'The tool parses the packet and extracts the relevant facts.',
  },
  {
    icon: DatabaseSearchIcon,
    tone: 'accent',
    text: 'The tool retrieves the applicable criteria in hierarchical order and checks each fact against them.',
  },
  {
    icon: ListCheckIcon,
    tone: 'routine',
    text: 'The nurse sees the extracted facts, a criteria checklist with a status per line, and source citations side by side.',
  },
  {
    icon: FlagIcon,
    tone: 'warning',
    text: "For an ambiguous criterion, the tool doesn't guess. It shows which criterion is unresolved, the exact source sentence, and why that sentence doesn't clearly confirm the requirement.",
  },
  {
    icon: BoltIcon,
    tone: 'success',
    text: 'The nurse applies judgment in seconds, or sends one precise clarification request instead of a vague back-and-forth.',
  },
  {
    icon: FileCheckIcon,
    tone: 'success',
    text: 'Once resolved, the nurse approves, and every criterion traces to its source. The tool never decides alone.',
  },
  {
    icon: StethoscopeIcon,
    tone: 'routine',
    text: 'If confidence is low on several criteria, the case goes to a medical director with the same structured brief.',
  },
]

export default function LandingPage({ onEnter, theme }) {
  const [view, setView] = useState('current')
  const [showDiagram, setShowDiagram] = useState(false)
  const isCurrent = view === 'current'
  const otherPaths = isCurrent ? CURRENT_OTHER_PATHS : FUTURE_OTHER_PATHS

  return (
    <div className="mx-auto flex max-w-5xl flex-col px-6 py-6 lg:h-dvh lg:justify-center lg:overflow-hidden lg:py-4">
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-3 rounded-full border border-brand/25 bg-gradient-to-r from-brand-tint via-surface to-brand-tint py-1.5 pl-1.5 pr-6 shadow-sm">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-dark text-white shadow-md shadow-brand/30">
            <ClipboardIcon className="h-[18px] w-[18px]" />
          </span>
          <p className="bg-gradient-to-r from-brand-dark to-brand bg-clip-text text-[13px] font-semibold uppercase tracking-[0.22em] text-transparent sm:text-sm">
            Prior Authorization Decision Support
          </p>
        </div>
      </div>
      <h1 className="mt-4 text-center text-2xl font-semibold text-ink">
        A working prototype for UM nurse review
      </h1>
      <p className="mx-auto mt-2 max-w-3xl text-center text-sm text-ink-soft">
        This demo follows five prior-authorization cases: a clean approval, two provider
        clarifications (one expedited), a medical-director escalation, and a packet that can't be parsed. In each
        one the tool extracts the facts and checks them against a criteria list, and the nurse or
        medical director still makes the decision.
      </p>

      <div className="mt-4 flex justify-center">
        <div className="inline-flex rounded-full border border-line bg-paper p-1">
          <button
            onClick={() => setView('current')}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              isCurrent ? 'bg-notmet text-white' : 'text-ink-faint hover:text-ink'
            }`}
          >
            Current State
          </button>
          <button
            onClick={() => setView('future')}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              !isCurrent ? 'bg-brand text-white' : 'text-ink-faint hover:text-ink'
            }`}
          >
            Future State
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-col rounded-lg lg:min-h-[392px] border border-line bg-surface p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">
            {isCurrent ? 'Today, without the tool' : 'With this prototype'}
          </p>
          <button
            onClick={() => setShowDiagram(true)}
            className="flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-xs text-ink-faint transition hover:border-brand/40 hover:text-brand-dark"
            aria-label={`View the ${isCurrent ? 'manual' : 'AI-assisted'} process as a flow diagram`}
            title="View as a flow diagram"
          >
            <FlowIcon className="h-3.5 w-3.5" />
            Flow diagram
          </button>
        </div>
        <div className="mt-3 grid flex-1 gap-6 lg:grid-cols-[3fr_2fr]">
        <div className="self-start">
          {isCurrent && (
            <div className="mb-2 flex items-center gap-3 rounded-lg border border-notmet-border bg-notmet-bg px-3 py-1.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-notmet bg-surface text-base font-semibold text-notmet">
                14
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">Pages, one packet, read manually</p>
                <p className="text-xs text-ink-soft">
                  Every request starts with a full read, before any criterion can be checked.
                </p>
              </div>
            </div>
          )}
          <ol className="space-y-1.5">
            {(isCurrent ? CURRENT_STEPS : FUTURE_STEPS).map((step) => (
              <li key={step.text} className="flex items-start gap-2.5">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${TONE[step.tone]}`}
                >
                  <step.icon className="h-3.5 w-3.5" />
                </span>
                <p className="pt-0.5 text-[13px] leading-snug text-ink-soft">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="flex flex-col self-stretch border-t border-line pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">
            {isCurrent ? "Where today's process costs you either way" : 'The 4 paths this demo covers'}
          </p>
          <ul className="mt-3 flex flex-1 flex-col justify-evenly gap-3">
            {otherPaths.map((path) => (
              <li key={path.label} className="flex items-baseline gap-2.5 text-sm">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center self-start rounded-full border ${TONE[path.tone ?? 'critical']}`}
                >
                  <path.icon className="h-3.5 w-3.5" />
                </span>
                <span>
                  <span className="font-medium text-ink">{path.label}</span>
                  <span className="text-ink-faint">{/[.!?]$/.test(path.label) ? ' ' : ': '}{path.detail}</span>
                  {path.badge && (
                    <span className="mt-1.5 flex w-fit items-center gap-1 rounded-full border border-notmet-border bg-notmet-bg px-2 py-0.5 text-[11px] font-medium text-notmet">
                      <BoltIcon className="h-3 w-3 shrink-0" />
                      Expedited · 72h
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
        </div>
      </div>

      <div className="mt-4 flex justify-center">
        <button
          onClick={onEnter}
          className="rounded-md bg-brand px-6 py-3 text-sm font-medium text-white transition hover:bg-brand-dark"
        >
          Enter the Prototype →
        </button>
      </div>

      <Modal
        open={showDiagram}
        onClose={() => setShowDiagram(false)}
        title={isCurrent ? "Today's process, as a flow" : 'How every case flows through the prototype'}
        size={isCurrent ? 'md' : 'lg'}
      >
        <WorkflowDiagram
          definition={isCurrent ? CURRENT_FLOW_DEFINITION : FUTURE_FLOW_DEFINITION}
          label={isCurrent ? "TODAY'S PROCESS" : 'APP FLOW'}
          sublabel={isCurrent ? 'Manual review path' : 'All 4 case paths, start to determination'}
          theme={theme}
        />
      </Modal>
    </div>
  )
}
