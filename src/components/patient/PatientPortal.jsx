import { useEffect, useMemo, useRef, useState } from 'react'
import BackButton from '../BackButton'
import RequestTab from './RequestTab'
import GetReadyTab from './GetReadyTab'
import CostsTab from './CostsTab'
import HelpTab from './HelpTab'
import { BellIcon, ClockIcon, LockIcon, SpeakerIcon, StopIcon } from './PatientIcons'
import { LANGS, formatWhen, makeT } from '../../data/patientI18n'
import { portalFor } from '../../data/patientPortal'
import { derivePatientStatus, patientNotifications } from '../../data/patientDomain'

const TABS = [
  { key: 'request', label: 'tabRequest' },
  { key: 'ready', label: 'tabReady', needsApproval: true },
  { key: 'costs', label: 'tabCosts', needsApproval: true },
  { key: 'help', label: 'tabHelp' },
]

const LANG_KEY = 'pre-auth-demo-patient-lang'

function initialLang() {
  try {
    const v = localStorage.getItem(LANG_KEY)
    if (v === 'en' || v === 'es') return v
  } catch {
    // Storage blocked: fall through to English.
  }
  return 'en'
}

function TimelineBadge({ fmt, caseData, rt }) {
  const decided = Boolean(rt.determination)
  const clock = caseData.cmsClock
  const critical = clock.type === 'expedited'
  return (
    <div
      title={fmt.t('clockHelp')}
      className={`inline-flex flex-wrap items-center gap-x-2 gap-y-0.5 rounded-full border px-3 py-1 text-xs font-medium ${
        decided
          ? 'border-line bg-paper text-ink-soft'
          : critical
            ? 'border-notmet-border bg-notmet-bg text-notmet'
            : 'border-nurse/30 bg-nurse-tint text-nurse-dark'
      }`}
    >
      <ClockIcon className="h-3.5 w-3.5" />
      {fmt.t(critical ? 'critical' : 'standard')}
      <span className="opacity-70">·</span>
      {decided
        ? fmt.t('decided')
        : critical
          ? fmt.t('hoursLeft', { n: clock.hoursRemaining })
          : fmt.t('daysLeft', { n: clock.daysRemaining })}
    </div>
  )
}

// Simulated delivery of each status change by the patient's chosen channel.
function Notifications({ fmt, caseData, rt, portal, onSeen }) {
  const [open, setOpen] = useState(false)
  const items = patientNotifications(caseData, rt)
  const unread = Math.max(0, items.length - rt.patient.notifSeen)
  const { sms, email } = rt.patient.notify
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    function onDoc(e) {
      if (!ref.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => {
          setOpen((o) => !o)
          if (!open) onSeen(items.length)
        }}
        aria-label={`${fmt.t('notifications')}${unread ? ` (${unread})` : ''}`}
        aria-expanded={open}
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface text-ink-soft transition hover:text-ink"
      >
        <BellIcon className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-notmet px-1 text-[10px] font-semibold text-white">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-line bg-surface shadow-xl">
          <p className="border-b border-line px-4 py-2.5 text-sm font-semibold text-ink">{fmt.t('notifications')}</p>
          {items.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-ink-faint">{fmt.t('noNotifications')}</p>
          ) : (
            <ul className="max-h-96 divide-y divide-line overflow-y-auto">
              {items.map((e) => (
                <li key={e.id} className="px-4 py-3">
                  <p className="text-sm text-ink">
                    {fmt.t('notifMessage', {
                      plan: 'Concord',
                      text: fmt.t(e.key, { office: e.key === 'act_initiated' ? portal.provider.officeShort : fmt.L(portal.provider.office), plan: fmt.t('planName') }),
                    })}
                  </p>
                  <p className="mt-1 text-[11px] text-ink-faint">
                    {[
                      sms && fmt.t('sentBySms', { phone: portal.contact.phone }),
                      email && fmt.t('sentByEmail', { email: portal.contact.email }),
                      !sms && !email && fmt.t('portalOnly'),
                    ]
                      .filter(Boolean)
                      .join(' · ')}{' '}
                    · {formatWhen(fmt, e.atMs, e.at)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

// Reads the visible tab aloud with the browser's built-in speech engine,
// in the portal's current language. Keyed by tab and language where it's
// used, so switching either remounts it and the cleanup stops the speech.
function ReadAloud({ fmt, targetRef }) {
  const [speaking, setSpeaking] = useState(false)
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window

  useEffect(() => () => supported && window.speechSynthesis.cancel(), [supported])

  if (!supported) return null

  function toggle() {
    if (speaking) {
      window.speechSynthesis.cancel()
      setSpeaking(false)
      return
    }
    const text = targetRef.current?.innerText ?? ''
    const u = new SpeechSynthesisUtterance(text)
    u.lang = LANGS.find((l) => l.key === fmt.lang).speech
    u.rate = 0.95
    u.onend = () => setSpeaking(false)
    u.onerror = () => setSpeaking(false)
    window.speechSynthesis.speak(u)
    setSpeaking(true)
  }

  return (
    <button
      onClick={toggle}
      aria-pressed={speaking}
      className={`flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition ${
        speaking ? 'border-nurse bg-nurse text-white' : 'border-line bg-surface text-ink-soft hover:text-ink'
      }`}
    >
      {speaking ? <StopIcon className="h-3.5 w-3.5" /> : <SpeakerIcon className="h-3.5 w-3.5" />}
      <span className="hidden sm:inline">{speaking ? fmt.t('stopReading') : fmt.t('readAloud')}</span>
    </button>
  )
}

export default function PatientPortal({ caseData, rt, actions, onBack, initialTab = 'request' }) {
  const [lang, setLangState] = useState(initialLang)
  const [tab, setTab] = useState(initialTab)
  const fmt = useMemo(() => makeT(lang), [lang])
  const portal = portalFor(caseData.id)
  const approved = derivePatientStatus(rt) === 'approved'
  const contentRef = useRef(null)
  const caseId = caseData.id

  const { patientView } = actions
  useEffect(() => {
    patientView(caseId)
  }, [caseId, patientView])

  useEffect(() => {
    document.documentElement.lang = lang
    return () => {
      document.documentElement.lang = 'en'
    }
  }, [lang])

  function setLang(v) {
    setLangState(v)
    try {
      localStorage.setItem(LANG_KEY, v)
    } catch {
      // Storage blocked: the choice still holds for this visit.
    }
  }

  // Bound to this case, so the tabs call actions without knowing the id.
  const bound = useMemo(
    () => ({
      accept: (payment) => actions.patientAccept(caseId, payment),
      decline: (d) => actions.patientDecline(caseId, d),
      reopen: () => actions.patientReopen(caseId),
      assistance: (a) => actions.patientAssistance(caseId, a),
      requestAppeal: () => actions.patientRequestAppeal(caseId),
      advancePeerToPeer: (stage) => actions.advancePeerToPeer(caseId, stage),
      callback: (req) => actions.patientCallback(caseId, req),
      toggleChecklist: (id) => actions.togglePatientChecklist(caseId, id),
      setNotify: (n) => actions.setPatientNotify(caseId, n),
    }),
    [actions, caseId],
  )

  const tabProps = { fmt, caseData, rt, portal, actions: bound }

  return (
    <div className="min-h-dvh bg-paper">
      <BackButton onClick={onBack} label={fmt.t('allPatients')} />
      <div className="mx-auto max-w-3xl px-4 pb-16 pt-16 sm:px-6">
        <header>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-nurse-dark">
              {fmt.t('planName')} · {fmt.t('portalName')}
            </p>
            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-full border border-line bg-surface p-0.5" role="group" aria-label={fmt.t('language')}>
                {LANGS.map((l) => (
                  <button
                    key={l.key}
                    onClick={() => setLang(l.key)}
                    aria-pressed={lang === l.key}
                    title={l.label}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                      lang === l.key ? 'bg-nurse text-white' : 'text-ink-faint hover:text-ink'
                    }`}
                  >
                    {l.short}
                  </button>
                ))}
              </div>
              <ReadAloud key={`${tab}-${lang}`} fmt={fmt} targetRef={contentRef} />
              <Notifications
                fmt={fmt}
                caseData={caseData}
                rt={rt}
                portal={portal}
                onSeen={(n) => actions.markPatientNotificationsSeen(caseId, n)}
              />
            </div>
          </div>
          <h1 className="mt-3 text-[26px] font-semibold leading-tight text-ink">{caseData.memberName}</h1>
          <p className="mt-1 text-sm text-ink-soft">{fmt.L(portal.procedure)}</p>
          <p className="mt-1 text-xs text-ink-faint">
            {fmt.t('member')} {caseData.memberId} · {fmt.t('requestedBy')} {portal.provider.officeShort}
          </p>
          <div className="mt-3">
            <TimelineBadge fmt={fmt} caseData={caseData} rt={rt} />
          </div>
        </header>

        <nav className="mt-6 flex gap-1 overflow-x-auto border-b border-line" role="tablist">
          {TABS.map((t) => {
            const locked = t.needsApproval && !approved
            return (
              <button
                key={t.key}
                role="tab"
                aria-selected={tab === t.key}
                onClick={() => setTab(t.key)}
                className={`flex shrink-0 items-center gap-1.5 border-b-2 px-2 py-2 text-[13px] font-medium transition sm:px-3 sm:text-sm ${
                  tab === t.key ? 'border-nurse text-ink' : 'border-transparent text-ink-faint hover:text-ink'
                }`}
              >
                {locked && <LockIcon className="h-3 w-3" />}
                {fmt.t(t.label)}
              </button>
            )
          })}
        </nav>

        <main ref={contentRef} className="mt-5" role="tabpanel">
          {tab === 'request' && <RequestTab {...tabProps} />}
          {tab === 'ready' && <GetReadyTab {...tabProps} />}
          {tab === 'costs' && <CostsTab {...tabProps} />}
          {tab === 'help' && <HelpTab {...tabProps} />}
        </main>

        <p className="mt-10 text-center text-[11px] text-ink-faint">{fmt.t('demoNote')}</p>
      </div>
    </div>
  )
}
