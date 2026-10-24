import { useEffect, useRef, useState } from 'react'
import { Card, PrimaryButton, Select } from './PortalBits'
import { ChatIcon, CheckIcon, PhoneIcon } from './PatientIcons'
import { formatWhen } from '../../data/patientI18n'
import { answerPatientQuestion, suggestedQuestions } from '../../data/patientAssistant'
import { derivePatientStatus } from '../../data/patientDomain'

function Assistant({ fmt, caseData, rt, portal, onWantCallback }) {
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const listRef = useRef(null)
  const status = derivePatientStatus(rt)

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  function ask(question) {
    const q = question.trim()
    if (!q) return
    const answer = answerPatientQuestion(q, { ...fmt, caseData, rt, portal })
    setMessages((m) => [...m, { role: 'user', text: q }, { role: 'assistant', ...answer }])
    setDraft('')
  }

  return (
    <Card>
      <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
        <ChatIcon className="h-4 w-4 text-nurse-dark" />
        {fmt.t('assistantTitle')}
      </h2>
      <p className="mt-1 text-xs text-ink-soft">{fmt.t('assistantIntro')}</p>

      {messages.length > 0 && (
        <div ref={listRef} className="mt-3 max-h-80 space-y-2 overflow-y-auto rounded-lg border border-line bg-paper p-3" aria-live="polite">
          {messages.map((m, i) =>
            m.role === 'user' ? (
              <p key={i} className="ml-auto w-fit max-w-[85%] rounded-lg rounded-br-sm bg-nurse-solid px-3 py-2 text-sm text-white">
                {m.text}
              </p>
            ) : (
              <div key={i} className="max-w-[90%] rounded-lg rounded-bl-sm border border-line bg-surface px-3 py-2 text-sm text-ink">
                {m.text}
                {m.callback && (
                  <button onClick={onWantCallback} className="mt-2 flex items-center gap-1.5 text-xs font-medium text-nurse-dark underline-offset-2 hover:underline">
                    <PhoneIcon className="h-3.5 w-3.5" />
                    {fmt.t('callbackTitle')}
                  </button>
                )}
              </div>
            ),
          )}
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-1.5">
        {suggestedQuestions(status, fmt.lang).map((q) => (
          <button
            key={q}
            onClick={() => ask(q)}
            className="rounded-full border border-nurse/30 bg-nurse-tint px-3 py-1 text-xs text-nurse-dark transition hover:border-nurse"
          >
            {q}
          </button>
        ))}
      </div>

      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          ask(draft)
        }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={fmt.t('assistantPlaceholder')}
          aria-label={fmt.t('assistantPlaceholder')}
          className="min-w-0 flex-1 rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-nurse focus:outline-none"
        />
        <PrimaryButton type="submit" disabled={!draft.trim()}>
          {fmt.t('assistantSend')}
        </PrimaryButton>
      </form>
      <p className="mt-2 text-[11px] text-ink-faint">{fmt.t('assistantDisclaimer')}</p>
    </Card>
  )
}

const TOPICS = ['status', 'costs', 'prep', 'other']
const TIMES = ['morning', 'afternoon', 'evening']

function Callback({ fmt, rt, onRequest, formRef }) {
  const [who, setWho] = useState('office')
  const [topic, setTopic] = useState('status')
  const [time, setTime] = useState('morning')
  const [confirmed, setConfirmed] = useState(null)
  const callbacks = rt.patient.callbacks

  return (
    <Card>
      <h2 ref={formRef} tabIndex={-1} className="flex items-center gap-2 text-sm font-semibold text-ink outline-none">
        <PhoneIcon className="h-4 w-4 text-nurse-dark" />
        {fmt.t('callbackTitle')}
      </h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <Select label={fmt.t('callbackWho')} value={who} onChange={setWho} options={['office', 'plan'].map((v) => ({ value: v, label: fmt.t(`who_${v}`) }))} />
        <Select label={fmt.t('callbackTopic')} value={topic} onChange={setTopic} options={TOPICS.map((v) => ({ value: v, label: fmt.t(`topic_${v}`) }))} />
        <Select label={fmt.t('callbackTime')} value={time} onChange={setTime} options={TIMES.map((v) => ({ value: v, label: fmt.t(`time_${v}`) }))} />
      </div>
      <PrimaryButton
        className="mt-4"
        onClick={() => {
          onRequest({ who, topic, time })
          setConfirmed({ who, time })
        }}
      >
        {fmt.t('callbackSubmit')}
      </PrimaryButton>
      {confirmed && (
        <p className="mt-3 flex items-start gap-2 rounded-md border border-met-border bg-met-bg px-3 py-2 text-xs text-met">
          <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {fmt.t('callbackDone', { who: fmt.cap(fmt.t(`who_${confirmed.who}_3p`)), time: fmt.t(`time_${confirmed.time}`).split(' (')[0].toLowerCase() })}
        </p>
      )}
      {callbacks.length > 0 && (
        <div className="mt-4 border-t border-line pt-3">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">{fmt.t('callbackList')}</p>
          <ul className="mt-1.5 space-y-1 text-sm">
            {[...callbacks].reverse().map((c) => (
              <li key={c.id} className="flex flex-wrap justify-between gap-x-3 text-ink">
                <span>
                  {fmt.t(`who_${c.who}`)} · {fmt.t(`topic_${c.topic}`)}
                </span>
                <span className="text-xs text-ink-faint">
                  {c.id} · {formatWhen(fmt, c.atMs)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  )
}

function Toggle({ checked, onChange, label, detail }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 py-2">
      <span>
        <span className="block text-sm text-ink">{label}</span>
        <span className="block text-xs text-ink-faint">{detail}</span>
      </span>
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span
        aria-hidden
        className="relative h-6 w-10 shrink-0 rounded-full bg-line transition peer-checked:bg-nurse peer-focus-visible:ring-2 peer-focus-visible:ring-nurse/40 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-4"
      />
    </label>
  )
}

function NotifyPrefs({ fmt, rt, portal, onChange }) {
  const n = rt.patient.notify
  return (
    <Card title={fmt.t('notifyTitle')}>
      <p className="text-xs text-ink-soft">{fmt.t('notifyIntro')}</p>
      <div className="mt-2 divide-y divide-line">
        <Toggle checked={n.sms} onChange={(v) => onChange({ ...n, sms: v })} label={fmt.t('notifySms')} detail={portal.contact.phone} />
        <Toggle checked={n.email} onChange={(v) => onChange({ ...n, email: v })} label={fmt.t('notifyEmail')} detail={portal.contact.email} />
      </div>
      {!n.sms && !n.email && <p className="mt-2 text-xs text-ink-faint">{fmt.t('notifyNone')}</p>}
    </Card>
  )
}

export default function HelpTab({ fmt, caseData, rt, portal, actions }) {
  const callbackRef = useRef(null)
  return (
    <div className="space-y-4">
      {/* Keyed by language: switching restarts the chat so every bubble is in one language. */}
      <Assistant
        key={fmt.lang}
        fmt={fmt}
        caseData={caseData}
        rt={rt}
        portal={portal}
        onWantCallback={() => {
          callbackRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          callbackRef.current?.focus({ preventScroll: true })
        }}
      />
      <Callback fmt={fmt} rt={rt} onRequest={actions.callback} formRef={callbackRef} />
      <NotifyPrefs fmt={fmt} rt={rt} portal={portal} onChange={actions.setNotify} />
    </div>
  )
}
